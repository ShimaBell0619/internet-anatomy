import assert from 'node:assert/strict';
import test from 'node:test';
import {
  advanceCacheTime,
  createCacheLabState,
  previewCacheLookup,
  runCacheLookup,
  secondsPastAnswerExpiry,
  secondsPastDelegationExpiry,
  type CacheLabSeed,
} from '../src/lib/cacheLab.ts';

const seed: CacheLabSeed = {
  hostname: 'example.com',
  answerTtl: 60,
  delegationTtl: 300,
  answerSummary: 'A 192.0.2.10',
  delegationSummary: 'example.com. delegation',
};

test('first lookup performs full resolution and primes both cache layers', () => {
  const initial = createCacheLabState();
  assert.equal(previewCacheLookup(seed, initial).kind, 'full-resolution');

  const afterLookup = runCacheLookup(seed, initial);
  assert.equal(afterLookup.answerCachedAt, 0);
  assert.equal(afterLookup.delegationCachedAt, 0);
  assert.equal(afterLookup.lastLookup?.kind, 'full-resolution');
  assert.deepEqual(previewCacheLookup(seed, afterLookup), {
    kind: 'answer-cache-hit',
    answerRemaining: 60,
    delegationRemaining: 300,
  });
});

test('repeated lookup while answer TTL is valid stays inside resolver answer cache', () => {
  const primed = runCacheLookup(seed, createCacheLabState());
  const later = advanceCacheTime(primed, 20);

  assert.deepEqual(previewCacheLookup(seed, later), {
    kind: 'answer-cache-hit',
    answerRemaining: 40,
    delegationRemaining: 280,
  });
  assert.equal(runCacheLookup(seed, later).lastLookup?.kind, 'answer-cache-hit');
});

test('answer expiry with valid delegation skips Root and TLD and refreshes only answer cache', () => {
  const primed = runCacheLookup(seed, createCacheLabState());
  const afterAnswerExpiry = advanceCacheTime(primed, secondsPastAnswerExpiry(seed, primed));

  const preview = previewCacheLookup(seed, afterAnswerExpiry);
  assert.equal(preview.kind, 'delegation-cache-hit');
  assert.equal(preview.answerRemaining, 0);
  assert.ok(preview.delegationRemaining > 0);

  const refreshed = runCacheLookup(seed, afterAnswerExpiry);
  assert.equal(refreshed.lastLookup?.kind, 'delegation-cache-hit');
  assert.equal(refreshed.answerCachedAt, refreshed.now);
  assert.equal(refreshed.delegationCachedAt, 0);
});

test('delegation expiry reopens full resolution', () => {
  const primed = runCacheLookup(seed, createCacheLabState());
  const afterDelegationExpiry = advanceCacheTime(primed, secondsPastDelegationExpiry(seed, primed));

  assert.deepEqual(previewCacheLookup(seed, afterDelegationExpiry), {
    kind: 'full-resolution',
    answerRemaining: 0,
    delegationRemaining: 0,
  });
});

test('advancing time rejects non-positive or non-finite values', () => {
  const initial = createCacheLabState();
  assert.equal(advanceCacheTime(initial, 0), initial);
  assert.equal(advanceCacheTime(initial, -1), initial);
  assert.equal(advanceCacheTime(initial, Number.NaN), initial);
});
