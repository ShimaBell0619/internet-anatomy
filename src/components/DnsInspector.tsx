import type { DnsExploration, DnsRecord, NamespaceStage } from '../lib/dns';
import { recordKey, type ExplorerSelection } from './DnsPath';

interface DnsInspectorProps {
  exploration: DnsExploration;
  selection: ExplorerSelection;
}

export function DnsInspector({ exploration, selection }: DnsInspectorProps) {
  if (selection.kind === 'record') {
    const record = exploration.answerRecords.find((item) => recordKey(item) === selection.key);
    return record ? <RecordInspector record={record} /> : null;
  }

  const stage = exploration.stages[selection.index] ?? exploration.stages[0];
  return <StageInspector stage={stage} exploration={exploration} />;
}

function StageInspector({
  stage,
  exploration,
}: {
  stage: NamespaceStage;
  exploration: DnsExploration;
}) {
  return (
    <aside className="inspector" aria-live="polite">
      <div className="inspector-kicker">LEARN</div>
      <h2>{titleFor(stage)}</h2>
      <p className="inspector-lead">{explanationFor(stage, exploration.hostname)}</p>

      <dl className="inspector-facts">
        <div>
          <dt>名前</dt>
          <dd>{stage.fqdn}</dd>
        </div>
        <div>
          <dt>NS</dt>
          <dd>{stage.nameServers.length > 0 ? `${stage.nameServers.length}件を観測` : 'この名前では未観測'}</dd>
        </div>
        <div>
          <dt>SOA</dt>
          <dd>{stage.soa ? 'あり' : 'この名前では未観測'}</dd>
        </div>
      </dl>

      {stage.nameServers.length > 0 && (
        <div className="inspector-section">
          <h3>Name servers</h3>
          <ul className="mono-list">
            {stage.nameServers.map((record) => (
              <li key={recordKey(record)}>{record.data}</li>
            ))}
          </ul>
        </div>
      )}

      {stage.soa && (
        <div className="inspector-section">
          <h3>SOA</h3>
          <p className="mono-block">{stage.soa.data}</p>
          <p className="micro-copy">TTL {stage.soa.ttl}s</p>
        </div>
      )}
    </aside>
  );
}

function RecordInspector({ record }: { record: DnsRecord }) {
  return (
    <aside className="inspector" aria-live="polite">
      <div className="inspector-kicker">ANSWER RECORD</div>
      <h2>{record.type}</h2>
      <p className="inspector-lead">{recordExplanation(record.type)}</p>
      <dl className="inspector-facts">
        <div>
          <dt>名前</dt>
          <dd>{record.name}</dd>
        </div>
        <div>
          <dt>値</dt>
          <dd className="break-anywhere">{record.data}</dd>
        </div>
        <div>
          <dt>TTL</dt>
          <dd>{record.ttl} 秒</dd>
        </div>
      </dl>
      <div className="inspector-section">
        <h3>TTLとは</h3>
        <p>Recursive Resolver がこの回答をキャッシュできる時間の目安です。短いほど変更が伝わりやすく、長いほど問い合わせを減らせます。</p>
      </div>
    </aside>
  );
}

function titleFor(stage: NamespaceStage): string {
  if (stage.kind === 'root') return 'Root DNS';
  if (stage.kind === 'tld') return 'TLD zone';
  if (stage.kind === 'host') return stage.nameServers.length > 0 ? 'Host / authoritative zone' : 'Host name';
  return stage.nameServers.length > 0 ? 'Delegated zone' : 'Namespace step';
}

function explanationFor(stage: NamespaceStage, hostname: string): string {
  if (stage.kind === 'root') {
    return 'DNS名前空間の最上位です。Rootは個々のWebサイトのIPを覚えるのではなく、各TLDをどのName Serverへ委任するかを案内します。';
  }
  if (stage.kind === 'tld') {
    return `${stage.fqdn} のName Serverです。ここから下位のDNSゾーンへ権限を委任して、${hostname} に近づいていきます。`;
  }
  if (stage.nameServers.length > 0) {
    return `この名前にはNSレコードがあり、DNSゾーンとして委任されていることを観測しました。より具体的な名前の回答は、このゾーンの権威情報から導かれます。`;
  }
  return 'DNS名前空間上の名前です。この名前自体ではNSレコードを観測していないため、独立した委任点とは限りません。';
}

function recordExplanation(type: string): string {
  if (type === 'A') return 'ホスト名をIPv4アドレスへ対応付けるレコードです。';
  if (type === 'AAAA') return 'ホスト名をIPv6アドレスへ対応付けるレコードです。';
  if (type === 'CNAME') return 'この名前が別の正規名を指すことを示すレコードです。解決はその正規名へ続きます。';
  return 'DNS問い合わせで返されたリソースレコードです。';
}
