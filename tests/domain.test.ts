import assert from 'node:assert/strict';
import test from 'node:test';
import { buildNamespaceCandidates, normalizeHostname, toFqdn } from '../src/lib/domain.ts';

test('normalizeHostname accepts a bare domain and URL', () => {
  assert.equal(normalizeHostname('Google.COM'), 'google.com');
  assert.equal(normalizeHostname('https://www.example.co.jp/path?q=1'), 'www.example.co.jp');
});

test('normalizeHostname rejects IP addresses and incomplete names', () => {
  assert.throws(() => normalizeHostname('127.0.0.1'), /IPアドレス/);
  assert.throws(() => normalizeHostname('localhost'), /TLD/);
});

test('buildNamespaceCandidates keeps every DNS namespace suffix', () => {
  assert.deepEqual(buildNamespaceCandidates('www.example.co.jp'), [
    '.',
    'jp',
    'co.jp',
    'example.co.jp',
    'www.example.co.jp',
  ]);
});

test('toFqdn adds one trailing dot', () => {
  assert.equal(toFqdn('.'), '.');
  assert.equal(toFqdn('google.com'), 'google.com.');
  assert.equal(toFqdn('google.com.'), 'google.com.');
});
