import type { DnsStoryStep } from '../lib/story.ts';

interface DnsStoryRouteProps {
  steps: DnsStoryStep[];
  activeIndex: number;
}

export function DnsStoryRoute({ steps, activeIndex }: DnsStoryRouteProps) {
  return (
    <nav className="story-route" aria-label="DNS Resolution Story route">
      <ol>
        {steps.map((step, index) => (
          <li key={step.id} data-active={index === activeIndex ? 'true' : 'false'}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{routeLabel(step)}</strong>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function routeLabel(step: DnsStoryStep): string {
  switch (step.id) {
    case 'client-to-resolver':
      return 'CLIENT → RESOLVER';
    case 'root-referral':
      return 'ROOT';
    case 'tld-referral':
      return 'TLD';
    case 'authoritative-zone':
      return 'AUTHORITATIVE';
    case 'answer':
      return 'ANSWER';
    case 'resolver-to-client':
      return 'RESOLVER → CLIENT';
    default:
      return 'DELEGATION';
  }
}
