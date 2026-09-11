import assert from 'node:assert/strict';
import test from 'node:test';
import type { DnsExploration, NamespaceStage } from '../src/lib/dns.ts';
import { buildDnsStory } from '../src/lib/story.ts';

test('buildDnsStory maps each causal step to a directly selectable DNS actor', () => {
  const story = buildDnsStory(
    exploration([
      stage('.', 'root', ['a.root-servers.net.']),
      stage('com.', 'tld', ['a.gtld-servers.net.']),
      stage('google.com.', 'host', ['ns1.google.com.', 'ns2.google.com.'], true),
    ], [{ name: 'google.com.', type: 'A', ttl: 300, data: '142.250.0.1' }]),
  );

  assert.deepEqual(
    story.map((step) => step.id),
    ['client-to-resolver', 'root-referral', 'tld-referral', 'authoritative-zone', 'answer', 'resolver-to-client'],
  );
  assert.deepEqual(
    story.map((step) => step.action.target.id),
    ['resolver', 'stage-0', 'stage-1', 'stage-2', 'answer', 'client'],
  );
  assert.equal(story[0]?.action.source.id, 'client');
  assert.equal(story[1]?.action.source.id, 'resolver');
  assert.ok(story[1]?.action.alternatives.some((item) => item.actor.id === 'stage-1'));
  assert.match(story[1]?.action.alternatives[0]?.explanation ?? '', /まずRoot/);
  assert.deepEqual(story[3]?.focus, { kind: 'stage', index: 2 });
  assert.deepEqual(story[4]?.focus, { kind: 'answer', index: 0 });
  assert.equal(story.some((step) => step.visual?.kind === 'alias'), false);
});

test('buildDnsStory adds directly selectable intermediate delegation steps', () => {
  const story = buildDnsStory(
    exploration([
      stage('.', 'root', ['a.root-servers.net.']),
      stage('jp.', 'tld', ['a.dns.jp.']),
      stage('co.jp.', 'namespace', ['ns1.dns.jp.']),
      stage('example.co.jp.', 'host', ['ns1.example.net.'], true),
    ], [{ name: 'example.co.jp.', type: 'A', ttl: 120, data: '192.0.2.10' }]),
  );

  const delegation = story.find((step) => step.id === 'delegation-2');
  assert.equal(delegation?.action.target.id, 'stage-2');
  assert.equal(delegation?.action.target.kind, 'stage');

  const authoritative = story.find((step) => step.id === 'authoritative-zone');
  assert.deepEqual(authoritative?.focus, { kind: 'stage', index: 3 });
  assert.equal(authoritative?.action.target.id, 'stage-3');
});

test('buildDnsStory turns an observed CNAME into a visible alias handoff before the address', () => {
  const story = buildDnsStory(
    exploration([
      stage('.', 'root', ['a.root-servers.net.']),
      stage('com.', 'tld', ['a.gtld-servers.net.']),
      stage('github.com.', 'namespace', ['dns1.p08.nsone.net.'], true),
      stage('www.github.com.', 'host', []),
    ], [
      { name: 'www.github.com.', type: 'CNAME', ttl: 60, data: 'github.com.' },
      { name: 'github.com.', type: 'A', ttl: 60, data: '140.82.112.4' },
    ]),
  );

  const alias = story.find((step) => step.id === 'alias-0');
  assert.ok(alias);
  assert.equal(alias.action.source.kind, 'alias');
  assert.equal(alias.action.source.name, 'www.github.com');
  assert.equal(alias.action.target.kind, 'alias');
  assert.equal(alias.action.target.name, 'github.com');
  assert.deepEqual(alias.focus, { kind: 'answer', index: 0 });
  assert.equal(alias.visual?.outcome, 'terminal-address');

  const address = story.find((step) => step.id === 'alias-address');
  assert.ok(address);
  assert.equal(address.action.target.id, 'answer');
  assert.equal(address.action.target.role, 'ADDRESS');
  assert.equal(address.action.target.name, 'A 140.82.112.4');
  assert.match(address.action.target.detail, /github\.com owns/);
  assert.deepEqual(address.focus, { kind: 'answer', index: 1 });
  assert.equal(story.some((step) => step.id === 'answer'), false);
});

test('buildDnsStory keeps an alias-without-address outcome explicit', () => {
  const story = buildDnsStory(
    exploration([
      stage('.', 'root', ['a.root-servers.net.']),
      stage('com.', 'tld', ['a.gtld-servers.net.']),
      stage('example.com.', 'namespace', ['ns1.example.com.'], true),
      stage('alias.example.com.', 'host', []),
    ], [{ name: 'alias.example.com.', type: 'CNAME', ttl: 60, data: 'target.example.net.' }]),
  );

  const result = story.find((step) => step.id === 'alias-no-address');
  assert.ok(result);
  assert.equal(result.action.target.name, 'NO TERMINAL ADDRESS');
  assert.match(result.learned, /推測して補完しません/);
});

test('buildDnsStory keeps NODATA explicit without inventing an authoritative actor', () => {
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
  assert.equal(answer?.action.source.id, 'resolver');
  assert.equal(answer?.action.target.id, 'answer');
  assert.equal(answer?.action.target.name, 'NODATA');
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
