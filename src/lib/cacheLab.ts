import type { DnsExploration } from './dns.ts';

export type CacheLookupKind = 'full-resolution' | 'delegation-cache-hit' | 'answer-cache-hit';

export interface CacheLabSeed {
  hostname: string;
  answerTtl: number;
  delegationTtl: number;
  answerSummary: string;
  delegationSummary: string;
}

export interface CacheLookupResult {
  kind: CacheLookupKind;
  at: number;
}

export interface CacheLabState {
  now: number;
  answerCachedAt: number | null;
  delegationCachedAt: number | null;
  lastLookup: CacheLookupResult | null;
}

export interface CacheLabSnapshot {
  kind: CacheLookupKind;
  answerRemaining: number;
  delegationRemaining: number;
}

export function deriveCacheLabSeed(exploration: DnsExploration): CacheLabSeed {
  const addresses = exploration.answerRecords.filter((record) => record.type === 'A' || record.type === 'AAAA');
  const answerRecords = addresses.length > 0 ? addresses : exploration.answerRecords;
  const answerTtl = minimumPositive(answerRecords.map((record) => record.ttl), 300);

  const delegationRecords = exploration.stages.flatMap((stage) => stage.nameServers);
  const delegationTtl = minimumPositive(delegationRecords.map((record) => record.ttl), 3600);
  const authority = exploration.authoritativeZone ?? exploration.stages.at(-1)?.fqdn ?? exploration.hostname;

  return {
    hostname: exploration.hostname,
    answerTtl,
    delegationTtl,
    answerSummary: addresses.length > 0
      ? addresses.map((record) => `${record.type} ${record.data}`).join(' / ')
      : 'NO A / AAAA',
    delegationSummary: `${authority} delegation`,
  };
}

export function createCacheLabState(): CacheLabState {
  return {
    now: 0,
    answerCachedAt: null,
    delegationCachedAt: null,
    lastLookup: null,
  };
}

export function previewCacheLookup(seed: CacheLabSeed, state: CacheLabState): CacheLabSnapshot {
  const answerRemaining = remainingTtl(seed.answerTtl, state.answerCachedAt, state.now);
  const delegationRemaining = remainingTtl(seed.delegationTtl, state.delegationCachedAt, state.now);

  return {
    kind: answerRemaining > 0
      ? 'answer-cache-hit'
      : delegationRemaining > 0
        ? 'delegation-cache-hit'
        : 'full-resolution',
    answerRemaining,
    delegationRemaining,
  };
}

export function runCacheLookup(seed: CacheLabSeed, state: CacheLabState): CacheLabState {
  const snapshot = previewCacheLookup(seed, state);

  if (snapshot.kind === 'answer-cache-hit') {
    return { ...state, lastLookup: { kind: snapshot.kind, at: state.now } };
  }

  if (snapshot.kind === 'delegation-cache-hit') {
    return {
      ...state,
      answerCachedAt: state.now,
      lastLookup: { kind: snapshot.kind, at: state.now },
    };
  }

  return {
    ...state,
    answerCachedAt: state.now,
    delegationCachedAt: state.now,
    lastLookup: { kind: snapshot.kind, at: state.now },
  };
}

export function advanceCacheTime(state: CacheLabState, seconds: number): CacheLabState {
  if (!Number.isFinite(seconds) || seconds <= 0) return state;
  return { ...state, now: state.now + Math.ceil(seconds) };
}

export function secondsPastAnswerExpiry(seed: CacheLabSeed, state: CacheLabState): number {
  const remaining = remainingTtl(seed.answerTtl, state.answerCachedAt, state.now);
  return remaining > 0 ? remaining + 1 : 0;
}

export function secondsPastDelegationExpiry(seed: CacheLabSeed, state: CacheLabState): number {
  const remaining = remainingTtl(seed.delegationTtl, state.delegationCachedAt, state.now);
  return remaining > 0 ? remaining + 1 : 0;
}

function remainingTtl(ttl: number, cachedAt: number | null, now: number): number {
  if (cachedAt === null) return 0;
  return Math.max(0, ttl - Math.max(0, now - cachedAt));
}

function minimumPositive(values: number[], fallback: number): number {
  const positives = values.filter((value) => Number.isFinite(value) && value > 0);
  return positives.length > 0 ? Math.min(...positives) : fallback;
}
