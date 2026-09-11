import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAliasChain } from '../src/lib/alias.ts';
import type { DnsExploration, DnsRecord } from '../src/lib/dns.ts';

test('buildAliasChain follows one CNAME hop and keeps terminal record ownership', () => {
  const chain = buildAliasChain(exploration('www.github.com', [
    record('www.github.com.', 'CNAME', 'github.com.'),
    record('github.com.', 'A', '140.82.112.4'),
  ]));

  assert.ok(chain);
  assert.equal(chain.queryName, 'www.github.com');
  assert.deepEqual(chain.hops.map((hop) => [hop.ownerName, hop.targetName]), [
    ['www.github.com', 'github.com'],
  ]);
  assert.equal(chain.terminalName, 'github.com');
  assert.equal(chain.outcome, 'terminal-address');
  assert.deepEqual(chain.terminalRecords.map((item) => [item.name, item.type, item.data]), [
    ['github.com.', 'A', '140.82.112.4'],
  ]);
});

test('buildAliasChain follows multiple observed CNAME hops', () => {
  const chain = buildAliasChain(exploration('a.example.com', [
    record('a.example.com.', 'CNAME', 'b.example.net.'),
    record('b.example.net.', 'CNAME', 'c.example.org.'),
    record('c.example.org.', 'AAAA', '2001:db8::10'),
  ]));

  assert.ok(chain);
  assert.equal(chain.hops.length, 2);
  assert.equal(chain.hops[1]?.ownerName, 'b.example.net');
  assert.equal(chain.hops[1]?.targetName, 'c.example.org');
  assert.equal(chain.terminalName, 'c.example.org');
  assert.equal(chain.outcome, 'terminal-address');
});

test('buildAliasChain reports an alias without a terminal address instead of inventing one', () => {
  const chain = buildAliasChain(exploration('alias.example.com', [
    record('alias.example.com.', 'CNAME', 'target.example.net.'),
  ]));

  assert.ok(chain);
  assert.equal(chain.outcome, 'alias-without-address');
  assert.equal(chain.terminalName, 'target.example.net');
  assert.deepEqual(chain.terminalRecords, []);
});

test('buildAliasChain terminates malformed CNAME cycles', () => {
  const chain = buildAliasChain(exploration('a.example.com', [
    record('a.example.com.', 'CNAME', 'b.example.com.'),
    record('b.example.com.', 'CNAME', 'a.example.com.'),
  ]));

  assert.ok(chain);
  assert.equal(chain.outcome, 'cycle');
  assert.equal(chain.cycleAt, 'a.example.com');
  assert.equal(chain.hops.length, 2);
  assert.deepEqual(chain.terminalRecords, []);
});

test('buildAliasChain returns null for a direct address answer', () => {
  const chain = buildAliasChain(exploration('example.com', [
    record('example.com.', 'A', '192.0.2.10'),
  ]));
  assert.equal(chain, null);
});

function exploration(hostname: string, answerRecords: DnsRecord[]): DnsExploration {
  return {
    hostname,
    stages: [],
    answerRecords,
    authoritativeZone: null,
    elapsedMs: 1,
    resolver: 'Google Public DNS',
  };
}

function record(name: string, type: string, data: string): DnsRecord {
  return { name, type, ttl: 60, data };
}
