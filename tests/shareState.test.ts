import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_SHARE_STATE, parseShareState, serializeShareState } from '../src/lib/shareState.ts';

test('parses a shareable Story hostname through existing normalization', () => {
  const state = parseShareState('?mode=story&host=https%3A%2F%2FWWW.GITHUB.COM%2Fdocs');
  assert.equal(state.mode, 'story');
  assert.equal(state.host, 'www.github.com');
});

test('parses Compare pair independently', () => {
  const state = parseShareState('?mode=compare&left=google.com&right=https%3A%2F%2Fgithub.com%2Fopenai');
  assert.equal(state.mode, 'compare');
  assert.equal(state.left, 'google.com');
  assert.equal(state.right, 'github.com');
});

test('parses Break DNS Lab entry point', () => {
  const state = parseShareState('?mode=lab&host=example.com&lab=failure');
  assert.equal(state.mode, 'lab');
  assert.equal(state.host, 'example.com');
  assert.equal(state.lab, 'failure');
});

test('invalid URL state falls back safely without throwing', () => {
  const state = parseShareState('?mode=unknown&host=localhost&left=127.0.0.1&right=%20&lab=other');
  assert.deepEqual(state, DEFAULT_SHARE_STATE);
});

test('serializes only the meaningful entry state for each mode', () => {
  assert.equal(
    serializeShareState({ ...DEFAULT_SHARE_STATE, mode: 'story', host: 'www.github.com' }),
    '?mode=story&host=www.github.com',
  );
  assert.equal(
    serializeShareState({ ...DEFAULT_SHARE_STATE, mode: 'compare', left: 'google.com', right: 'github.com' }),
    '?mode=compare&left=google.com&right=github.com',
  );
  assert.equal(
    serializeShareState({ ...DEFAULT_SHARE_STATE, mode: 'lab', host: 'google.com', lab: 'failure' }),
    '?mode=lab&host=google.com&lab=failure',
  );
});
