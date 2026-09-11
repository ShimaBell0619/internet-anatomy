import type { DnsExploration, DnsRecord, NamespaceStage } from '../lib/dns';

export type ExplorerSelection =
  | { kind: 'stage'; index: number }
  | { kind: 'record'; key: string };

interface DnsPathProps {
  exploration: DnsExploration;
  selection: ExplorerSelection;
  onSelect: (selection: ExplorerSelection) => void;
}

export function DnsPath({ exploration, selection, onSelect }: DnsPathProps) {
  return (
    <section className="dns-path" aria-label={`${exploration.hostname} のDNS名前空間`}>
      <div className="path-rail" aria-hidden="true" />
      {exploration.stages.map((stage, index) => (
        <StageNode
          key={stage.fqdn}
          stage={stage}
          index={index}
          selected={selection.kind === 'stage' && selection.index === index}
          onSelect={() => onSelect({ kind: 'stage', index })}
        />
      ))}

      <section className="answer-branch" aria-label="DNS回答">
        <div className="answer-heading">
          <span>ANSWER</span>
          <strong>{exploration.answerRecords.length || '0'} records</strong>
        </div>
        {exploration.answerRecords.length > 0 ? (
          <div className="record-list">
            {exploration.answerRecords.map((record) => {
              const key = recordKey(record);
              return (
                <button
                  key={key}
                  type="button"
                  className="record-row"
                  aria-pressed={selection.kind === 'record' && selection.key === key}
                  onClick={() => onSelect({ kind: 'record', key })}
                >
                  <span className="record-type">{record.type}</span>
                  <span className="record-data">{record.data}</span>
                  <span className="record-ttl">TTL {record.ttl}s</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="empty-records">A / AAAA / CNAME の回答はありません。</p>
        )}
      </section>
    </section>
  );
}

function StageNode({
  stage,
  index,
  selected,
  onSelect,
}: {
  stage: NamespaceStage;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const label = stageLabel(stage, index);
  return (
    <button
      type="button"
      className="stage-node"
      data-selected={selected ? 'true' : 'false'}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="stage-index">{String(index + 1).padStart(2, '0')}</span>
      <span className="stage-copy">
        <span className="stage-role">{label}</span>
        <strong>{stage.fqdn}</strong>
      </span>
      <span className="stage-meta">
        {stage.nameServers.length > 0 ? `${stage.nameServers.length} NS` : 'namespace'}
      </span>
    </button>
  );
}

export function recordKey(record: DnsRecord): string {
  return `${record.name}|${record.type}|${record.data}`;
}

function stageLabel(stage: NamespaceStage, index: number): string {
  if (stage.kind === 'root') return 'ROOT';
  if (stage.kind === 'tld') return 'TLD';
  if (stage.kind === 'host') return stage.nameServers.length > 0 ? 'HOST + ZONE' : 'HOST';
  return stage.nameServers.length > 0 ? `DELEGATION ${index - 1}` : 'NAMESPACE';
}
