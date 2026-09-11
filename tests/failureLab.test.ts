import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFailureLabModel } from '../src/lib/failureLab.ts';

const hostname = 'example.com';

test('working model reaches a terminal answer', () => {
  const model = buildFailureLabModel(hostname, 'working');
  assert.equal(model.status, 'WORKING');
  assert.deepEqual(model.nodes.map((item) => item.role), [
    'CLIENT',
    'RESOLVER',
    'ROOT',
    'TLD',
    'AUTHORITATIVE',
    'ANSWER',
  ]);
});

test('NODATA keeps the name present and distinguishes it from NXDOMAIN', () => {
  const model = buildFailureLabModel(hostname, 'nodata');
  assert.equal(model.status, 'NOERROR / NODATA');
  assert.equal(model.nodes.at(-1)?.role, 'NODATA');
  assert.equal(model.nodes.at(-1)?.tone, 'stop');
  assert.match(model.explanation, /NOERROR/);
  assert.match(model.distinction, /NXDOMAIN/);
  assert.match(model.distinction, /名前そのものが存在しないとは言っていません|名前そのものが存在しない/);
});

test('NXDOMAIN models the name itself as absent', () => {
  const model = buildFailureLabModel(hostname, 'nxdomain');
  assert.equal(model.status, 'NXDOMAIN');
  assert.equal(model.nodes.at(-1)?.role, 'NXDOMAIN');
  assert.equal(model.nodes.at(-1)?.tone, 'stop');
  assert.match(model.distinction, /NODATA/);
});

test('missing delegation stops before authoritative DNS', () => {
  const model = buildFailureLabModel(hostname, 'missing-delegation');
  assert.equal(model.status, 'DELEGATION MISSING');
  assert.deepEqual(model.nodes.map((item) => item.role), ['CLIENT', 'RESOLVER', 'ROOT', 'TLD', 'STOP']);
  assert.equal(model.nodes.some((item) => item.role === 'AUTHORITATIVE'), false);
  assert.match(model.explanation, /委任/);
});

test('CNAME loop returns to a visited name and stops finitely', () => {
  const model = buildFailureLabModel(hostname, 'cname-loop');
  assert.equal(model.status, 'CNAME LOOP');
  assert.equal(model.nodes.length, 9);
  assert.deepEqual(model.nodes.slice(-4).map((item) => [item.role, item.name]), [
    ['ALIAS', 'example.com'],
    ['CNAME', 'alias.example.com'],
    ['CNAME', 'example.com'],
    ['STOP', 'visited name'],
  ]);
  assert.equal(model.nodes.at(-2)?.tone, 'loop');
  assert.equal(model.nodes.at(-1)?.tone, 'stop');
});
