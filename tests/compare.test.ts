import assert from 'node:assert/strict';
import test from 'node:test';
import type { DnsExploration, NamespaceStage } from '../src/lib/dns.ts';
import { buildDnsComparison } from '../src/lib/compare.ts';

test('buildDnsComparison keeps shared .com ancestry and splits at delegated host zones', () => {
  const comparison = buildDnsComparison(
    exploration('google.com', [
      stage('.', 'root', ['a.root-servers.net.']),
      stage('com.', 'tld', ['a.gtld-servers.net.']),
      stage('google.com.', 'host', ['ns1.google.com.']),
    ], [{ name: 'google.com.', type: 'A', ttl: 300, data: '142.250.0.1' }]),
    exploration('github.com', [
      stage('.', 'root', ['b.root-servers.net.']),
      stage('com.', 'tld', ['b.gtld-servers.net.']),
      stage('github.com.', 'host', ['dns1.p08.nsone.net.']),
    ], [{ name: 'github.com.', type: 'A', ttl: 60, data: '140.82.112.4' }]),
  );

  assert.deepEqual(comparison.sharedStages.map((item) => item.fqdn), ['.', 'com.']);
  assert.equal(comparison.divergence.kind, 'delegation');
  assert.equal(comparison.divergence.sharedThrough, 'com.');
  assert.equal(comparison.divergence.leftNext, 'google.com.');
  assert.equal(comparison.divergence.rightNext, 'github.com.');
  assert.equal(comparison.left.observedDelegationZone, 'google.com.');
  assert.equal(comparison.right.observedDelegationZone, 'github.com.');
  assert.match(comparison.title, /com\. までは共通/);
});

test('buildDnsComparison marks different TLDs as an earlier divergence', () => {
  const comparison = buildDnsComparison(
    exploration('google.com', [
      stage('.', 'root', ['a.root-servers.net.']),
      stage('com.', 'tld', ['a.gtld-servers.net.']),
      stage('google.com.', 'host', ['ns1.google.com.']),
    ], []),
    exploration('example.jp', [
      stage('.', 'root', ['a.root-servers.net.']),
      stage('jp.', 'tld', ['a.dns.jp.']),
      stage('example.jp.', 'host', ['ns1.example.jp.']),
    ], []),
  );

  assert.deepEqual(comparison.sharedStages.map((item) => item.fqdn), ['.']);
  assert.equal(comparison.divergence.kind, 'tld');
  assert.equal(comparison.divergence.leftNext, 'com.');
  assert.equal(comparison.divergence.rightNext, 'jp.');
  assert.match(comparison.title, /Rootまでは共通/);
  assert.match(comparison.explanation, /TLDが違えば/);
});

test('buildDnsComparison keeps missing downstream delegation and NODATA explicit', () => {
  const comparison = buildDnsComparison(
    exploration('missing.example.com', [
      stage('.', 'root', ['a.root-servers.net.']),
      stage('com.', 'tld', ['a.gtld-servers.net.']),
      stage('example.com.', 'namespace', []),
      stage('missing.example.com.', 'host', []),
    ], []),
    exploration('github.com', [
      stage('.', 'root', ['a.root-servers.net.']),
      stage('com.', 'tld', ['a.gtld-servers.net.']),
      stage('github.com.', 'host', ['dns1.p08.nsone.net.']),
    ], [{ name: 'github.com.', type: 'A', ttl: 60, data: '140.82.112.4' }]),
  );

  assert.equal(comparison.divergence.kind, 'delegation');
  assert.equal(comparison.left.observedDelegationZone, null);
  assert.equal(comparison.left.answerRecords.length, 0);
  assert.equal(comparison.right.observedDelegationZone, 'github.com.');
  assert.equal(comparison.right.answerRecords[0]?.data, '140.82.112.4');
});

function exploration(
  hostname: string,
  stages: NamespaceStage[],
  answerRecords: DnsExploration['answerRecords'],
): DnsExploration {
  return {
    hostname,
    stages,
    answerRecords,
    authoritativeZone: stages.findLast((item) => item.nameServers.length > 0)?.fqdn ?? null,
    elapsedMs: 12,
    resolver: 'Google Public DNS',
  };
}

function stage(
  fqdn: string,
  kind: NamespaceStage['kind'],
  nameServers: string[],
): NamespaceStage {
  return {
    name: fqdn === '.' ? '.' : fqdn.replace(/\.$/, ''),
    fqdn,
    kind,
    nameServers: nameServers.map((data) => ({ name: fqdn, type: 'NS', ttl: 300, data })),
    soa: null,
  };
}
