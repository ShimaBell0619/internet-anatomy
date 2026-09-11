import { useEffect, useMemo, useState } from 'react';
import type { DnsExploration } from '../lib/dns.ts';
import {
  advanceCacheTime,
  createCacheLabState,
  deriveCacheLabSeed,
  previewCacheLookup,
  runCacheLookup,
  secondsPastAnswerExpiry,
  secondsPastDelegationExpiry,
  type CacheLookupKind,
} from '../lib/cacheLab.ts';
import '../lab.css';

export function DnsCacheLab({ exploration }: { exploration: DnsExploration }) {
  const seed = useMemo(() => deriveCacheLabSeed(exploration), [exploration]);
  const [state, setState] = useState(createCacheLabState);

  useEffect(() => {
    setState(createCacheLabState());
  }, [seed.hostname, seed.answerTtl, seed.delegationTtl]);

  const snapshot = previewCacheLookup(seed, state);
  const nodes = pathFor(snapshot.kind, seed.hostname);
  const canExpireAnswer = state.answerCachedAt !== null && snapshot.answerRemaining > 0;
  const canExpireDelegation = state.delegationCachedAt !== null && snapshot.delegationRemaining > 0;

  const expireAnswer = () => {
    const seconds = secondsPastAnswerExpiry(seed, state);
    if (seconds > 0) setState((current) => advanceCacheTime(current, seconds));
  };

  const expireDelegation = () => {
    const seconds = secondsPastDelegationExpiry(seed, state);
    if (seconds > 0) setState((current) => advanceCacheTime(current, seconds));
  };

  return (
    <section className="cache-lab" aria-labelledby="cache-lab-title">
      <header className="cache-lab-header">
        <div>
          <p className="m-0 font-mono text-[9px] tracking-[.12em] text-[var(--color-warm)]">CACHE / TTL LAB · SIMULATION</p>
          <h2 id="cache-lab-title" className="mt-2 mb-0 text-[clamp(24px,3vw,40px)] leading-[1.05] font-semibold tracking-[-.045em]">
            同じ名前を、もう一度引いたら？
          </h2>
          <p className="mt-3 mb-0 max-w-3xl text-[12px] leading-6 text-[var(--color-paper-200)]">
            {seed.hostname} で観測したTTLを初期値にしたローカル模型です。時間を進めると、次の問い合わせで必要な経路だけが開きます。
          </p>
        </div>
        <div className="cache-clock" aria-label={`シミュレーション時刻 ${state.now} 秒`}>
          <span>SIMULATED TIME</span>
          <strong>+{state.now}s</strong>
        </div>
      </header>

      <div className="cache-lab-grid">
        <div className="cache-route-panel">
          <div className="cache-route-heading">
            <div>
              <span>IF YOU QUERY NOW</span>
              <strong>{lookupTitle(snapshot.kind)}</strong>
            </div>
            {state.lastLookup && (
              <small>LAST · {lookupTitle(state.lastLookup.kind)} @ +{state.lastLookup.at}s</small>
            )}
          </div>

          <ol className="cache-route" data-kind={snapshot.kind} aria-label={`次の問い合わせ経路: ${lookupTitle(snapshot.kind)}`}>
            {nodes.map((node, index) => (
              <li key={`${snapshot.kind}-${node.role}`}>
                <div className="cache-node">
                  <span>{node.role}</span>
                  <strong>{node.name}</strong>
                </div>
                {index < nodes.length - 1 && <i aria-hidden="true" />}
              </li>
            ))}
          </ol>

          <p className="cache-explanation">{lookupExplanation(snapshot.kind)}</p>
        </div>

        <aside className="cache-state" aria-label="シミュレーション中のResolver cache">
          <span className="cache-state-label">RESOLVER CACHE</span>
          <CacheEntry
            title="ANSWER"
            value={seed.answerSummary}
            ttl={seed.answerTtl}
            remaining={snapshot.answerRemaining}
            primed={state.answerCachedAt !== null}
          />
          <CacheEntry
            title="DELEGATION"
            value={seed.delegationSummary}
            ttl={seed.delegationTtl}
            remaining={snapshot.delegationRemaining}
            primed={state.delegationCachedAt !== null}
          />
        </aside>
      </div>

      <div className="cache-controls" aria-label="Cache Lab controls">
        <button
          type="button"
          className="cache-primary-action"
          onClick={() => setState((current) => runCacheLookup(seed, current))}
        >
          今問い合わせる
        </button>
        <button type="button" onClick={expireAnswer} disabled={!canExpireAnswer}>
          A / AAAAを期限切れにする
        </button>
        <button type="button" onClick={expireDelegation} disabled={!canExpireDelegation}>
          委任も期限切れにする
        </button>
        <button type="button" onClick={() => setState(createCacheLabState())}>
          リセット
        </button>
      </div>

      <p className="cache-disclosure">
        SIMULATION · Google Public DNSの実cacheを観測しているわけではありません。表示中のTTLを種にしたローカル状態模型で、経路の短縮はDNS cacheの概念を説明するものです。
      </p>
    </section>
  );
}

function CacheEntry({
  title,
  value,
  ttl,
  remaining,
  primed,
}: {
  title: string;
  value: string;
  ttl: number;
  remaining: number;
  primed: boolean;
}) {
  const status = !primed ? 'EMPTY' : remaining > 0 ? `${remaining}s LEFT` : 'EXPIRED';
  return (
    <div className="cache-entry" data-valid={primed && remaining > 0 ? 'true' : 'false'}>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
      <div className="cache-entry-ttl">
        <span>TTL {ttl}s</span>
        <strong>{status}</strong>
      </div>
    </div>
  );
}

function lookupTitle(kind: CacheLookupKind) {
  if (kind === 'answer-cache-hit') return 'ANSWER CACHE HIT';
  if (kind === 'delegation-cache-hit') return 'DELEGATION CACHE HIT';
  return 'FULL RESOLUTION';
}

function lookupExplanation(kind: CacheLookupKind) {
  if (kind === 'answer-cache-hit') {
    return '答え自体がまだcacheに残っています。Root / TLD / Authoritative DNSへ進まず、Resolver内で名前解決を終えられます。';
  }
  if (kind === 'delegation-cache-hit') {
    return 'A / AAAAは期限切れですが、委任先の手掛かりは残っています。Root / TLDをやり直さず、Authoritative DNSから答えだけ更新できます。';
  }
  return '使えるcacheがありません。RootからTLD、Authoritative DNSへ責任をたどり直す必要があります。';
}

function pathFor(kind: CacheLookupKind, hostname: string) {
  if (kind === 'answer-cache-hit') {
    return [
      { role: 'CLIENT', name: 'Your device' },
      { role: 'RESOLVER', name: 'Recursive resolver' },
      { role: 'ANSWER CACHE', name: hostname },
      { role: 'RETURN', name: 'Cached answer' },
    ];
  }
  if (kind === 'delegation-cache-hit') {
    return [
      { role: 'CLIENT', name: 'Your device' },
      { role: 'RESOLVER', name: 'Recursive resolver' },
      { role: 'DELEGATION CACHE', name: 'Known authority' },
      { role: 'AUTHORITATIVE', name: hostname },
      { role: 'ANSWER', name: 'Refresh A / AAAA' },
    ];
  }
  return [
    { role: 'CLIENT', name: 'Your device' },
    { role: 'RESOLVER', name: 'Recursive resolver' },
    { role: 'ROOT', name: '.' },
    { role: 'TLD', name: hostname.split('.').at(-1) ?? 'TLD' },
    { role: 'AUTHORITATIVE', name: hostname },
    { role: 'ANSWER', name: 'A / AAAA' },
  ];
}
