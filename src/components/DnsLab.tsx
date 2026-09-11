import type { DnsExploration } from '../lib/dns.ts';
import { DnsCacheLab } from './DnsCacheLab';
import { DnsFailureLab } from './DnsFailureLab';

export type LabSection = 'cache' | 'failure';

export function DnsLab({
  exploration,
  section,
  onSectionChange,
}: {
  exploration: DnsExploration;
  section: LabSection;
  onSectionChange: (section: LabSection) => void;
}) {
  return (
    <div className="grid gap-3">
      <nav className="grid grid-cols-2 gap-2" aria-label="DNS Lab experiment">
        <LabButton
          active={section === 'cache'}
          title="Cache / TTL"
          description="時間を進めて経路の短縮を見る"
          onClick={() => onSectionChange('cache')}
        />
        <LabButton
          active={section === 'failure'}
          title="Break DNS"
          description="条件を壊して停止位置を見る"
          onClick={() => onSectionChange('failure')}
        />
      </nav>
      {section === 'cache' ? (
        <DnsCacheLab exploration={exploration} />
      ) : (
        <DnsFailureLab hostname={exploration.hostname} />
      )}
    </div>
  );
}

function LabButton({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="min-w-0 border border-[var(--color-ink-700)] bg-[var(--color-ink-900)] px-4 py-3 text-left aria-pressed:border-[var(--color-warm)] aria-pressed:bg-[color:rgb(240_200_121_/_5%)] max-[560px]:px-2.5 max-[560px]:py-2"
    >
      <strong className="block text-[11px] font-semibold max-[560px]:text-[10px]">{title}</strong>
      <span className="mt-1 block text-[9px] leading-4 text-[var(--color-paper-400)] max-[560px]:text-[8px]">{description}</span>
    </button>
  );
}
