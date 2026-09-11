import type { FormEvent } from 'react';
import type { DnsComparison, DnsComparisonBranch, SharedDnsStage } from '../lib/compare.ts';
import '../compare.css';

interface DnsCompareQueryProps {
  left: string;
  right: string;
  loading: boolean;
  onLeftChange: (value: string) => void;
  onRightChange: (value: string) => void;
  onSubmit: () => void;
}

export function DnsCompareQuery({
  left,
  right,
  loading,
  onLeftChange,
  onRightChange,
  onSubmit,
}: DnsCompareQueryProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="compare-query" onSubmit={handleSubmit}>
      <label>
        <span>A</span>
        <input
          value={left}
          onChange={(event) => onLeftChange(event.target.value)}
          aria-label="比較する1つ目のURLまたはドメイン"
          autoComplete="url"
          spellCheck={false}
        />
      </label>
      <div className="compare-query-vs" aria-hidden="true">VS</div>
      <label>
        <span>B</span>
        <input
          value={right}
          onChange={(event) => onRightChange(event.target.value)}
          aria-label="比較する2つ目のURLまたはドメイン"
          autoComplete="url"
          spellCheck={false}
        />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? '比較中…' : 'DNSを比較'}
      </button>
    </form>
  );
}

interface DnsCompareProps {
  comparison: DnsComparison;
}

export function DnsCompare({ comparison }: DnsCompareProps) {
  return (
    <section className="compare-view" aria-labelledby="compare-title">
      <header className="compare-summary">
        <p className="compare-kicker">CONTRASTIVE DNS LENS</p>
        <h2 id="compare-title">{comparison.title}</h2>
        <p>{comparison.explanation}</p>
      </header>

      <div className="compare-map">
        <SharedTrunk stages={comparison.sharedStages} />

        <div className="compare-junction" data-kind={comparison.divergence.kind}>
          <span>{comparison.divergence.kind === 'tld' ? 'TLD DIVERGENCE' : comparison.divergence.kind === 'same-target' ? 'SAME TARGET' : 'DELEGATION DIVERGENCE'}</span>
          <strong>
            {comparison.divergence.kind === 'same-target'
              ? '分岐なし'
              : 'DNS責任がここから別々になる'}
          </strong>
        </div>

        <div className="compare-branches">
          <Branch side="A" branch={comparison.left} />
          <Branch side="B" branch={comparison.right} />
        </div>
      </div>

      <p className="compare-disclosure">
        この比較はGoogle Public DNSから観測したレコードを同じ名前空間に投影した学習モデルです。実際の反復問い合わせやパケット経路を捕捉したものではありません。
      </p>
    </section>
  );
}

function SharedTrunk({ stages }: { stages: SharedDnsStage[] }) {
  return (
    <section className="compare-trunk" aria-label="両ドメインで共有するDNS階層">
      <p>SHARED DNS TRUNK</p>
      <ol>
        {stages.map((stage, index) => (
          <li key={stage.fqdn}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div>
              <small>{stage.kind.toUpperCase()} · BOTH</small>
              <strong>{stage.fqdn}</strong>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Branch({ side, branch }: { side: 'A' | 'B'; branch: DnsComparisonBranch }) {
  return (
    <section className="compare-branch" data-side={side} aria-label={`${side}: ${branch.hostname}`}>
      <header>
        <span>{side}</span>
        <div>
          <small>DOMAIN BRANCH</small>
          <h3>{branch.hostname}</h3>
        </div>
      </header>

      <ol className="compare-branch-stages">
        {branch.stages.length > 0 ? branch.stages.map((stage) => (
          <li key={stage.fqdn}>
            <small>{stage.kind.toUpperCase()}</small>
            <strong>{stage.fqdn}</strong>
            <span>{stage.nameServers.length > 0 ? `NS ${stage.nameServers.length}` : '委任NS 未観測'}</span>
          </li>
        )) : (
          <li className="compare-branch-empty">
            <strong>追加の名前空間なし</strong>
            <span>共有部分の時点で対象名に到達しています。</span>
          </li>
        )}
      </ol>

      <div className="compare-branch-evidence">
        <div>
          <small>OBSERVED DELEGATION</small>
          <strong>{branch.observedDelegationZone ?? '下位の委任NSは未観測'}</strong>
        </div>
        <div>
          <small>ANSWER</small>
          {branch.answerRecords.length > 0 ? (
            <ul>
              {branch.answerRecords.slice(0, 4).map((record) => (
                <li key={`${record.name}|${record.type}|${record.data}`}>
                  <span>{record.type}</span>
                  <strong>{record.data}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <strong>NODATA</strong>
          )}
        </div>
      </div>
    </section>
  );
}
