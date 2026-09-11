import assert from 'node:assert/strict';
import test from 'node:test';
import type { DnsExploration, NamespaceStage } from '../src/lib/dns.ts';
import { buildDnsStory } from '../src/lib/story.ts';

test('buildDnsStory explains resolver, root, TLD, authoritative answer, and return', () => {
  const story = buildDnsStory(
    exploration([
      stage('.', 'root', ['a.root-servers.net.']),
      stage('com.', 'tld', ['a.gtld-servers.net.']),
      stage('google.com.', 'host', ['ns1.google.com.', 'ns2.google.com.'], true),
    ], [
      { name: 'google.com.', type: 'A', ttl: 300, data: '142.250.0.1' },
    ]),
  );

  assert.deepEqual(
    story.map((step) => step.id),
    [
      'client-to-resolver',
      'root-referral',
      'tld-referral',
      'authoritative-zone',
      'answer',
      'resolver-to-client',
    ],
  );
  assert.deepEqual(story[3]?.focus, { kind: 'stage', index: 2 });
  assert.deepEqual(story[4]?.focus, { kind: 'answer', index: 0 });
  assert.match(story[1]?.learned ?? '', /Rootの仕事/);
  assert.match(story[2]?.learned ?? '', /最終IPを直接管理するのではなく/);
});

test('buildDnsStory adds intermediate delegation steps without losing the final authoritative zone', () => {
  const story = buildDnsStory(
    exploration([
      stage('.', 'root', ['a.root-servers.net.']),
      stage('jp.', 'tld', ['a.dns.jp.']),
      stage('co.jp.', 'namespace', ['ns1.dns.jp.']),
      stage('example.co.jp.', 'host', ['ns1.example.net.'], true),
    ], [
      { name: 'example.co.jp.', type: 'A', ttl: 120, data: '192.0.2.10' },
    ]),
  );

  assert.ok(story.some((step) => step.id === 'delegation-2'));
  const authoritative = story.find((step) => step.id === 'authoritative-zone');
  assert.deepEqual(authoritative?.focus, { kind: 'stage', index: 3 });
});

test('buildDnsStory keeps NODATA explicit and does not invent an authoritative zone without observed delegation', () => {
  const story = buildDnsStory(
    exploration([
      stage('.', 'root', ['a.root-servers.net.']),
      stage('com.', 'tld', ['a.gtld-servers.net.']),
      stage('missing.example.com.', 'host', []),
    ], []),
  );

  assert.equal(story.some((step) => step.id === 'authoritative-zone'), false);
  const answer = story.find((step) => step.id === 'answer');
  assert.match(answer?.title ?? '', /該当レコードなし/);
  assert.match(answer?.learned ?? '', /NXDOMAINとは別/);
  assert.deepEqual(answer?.focus, { kind: 'stage', index: 2 });
});

function exploration(stages: NamespaceStage[], answerRecords: DnsExploration['answerRecords']): DnsExploration {
  return {
    hostname: stages.at(-1)?.fqdn.replace(/\.$/, '') ?? 'example.com',
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
  withSoa = false,
): NamespaceStage {
  return {
    name: fqdn === '.' ? '.' : fqdn.replace(/\.$/, ''),
    fqdn,
    kind,
    nameServers: nameServers.map((data) => ({ name: fqdn, type: 'NS', ttl: 300, data })),
    soa: withSoa
      ? { name: fqdn, type: 'SOA', ttl: 60, data: `${nameServers[0]} hostmaster.example. 1 60 60 60 60` }
      : null,
  };
}
