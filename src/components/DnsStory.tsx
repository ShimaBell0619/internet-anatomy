import type { DnsStoryStep } from '../lib/story.ts';

interface DnsStoryProps {
  steps: DnsStoryStep[];
  activeIndex: number;
  playing: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
}

export function DnsStory({
  steps,
  activeIndex,
  playing,
  onPrevious,
  onNext,
  onTogglePlay,
}: DnsStoryProps) {
  const step = steps[activeIndex] ?? steps[0];
  if (!step) return null;

  const atStart = activeIndex === 0;
  const atEnd = activeIndex === steps.length - 1;

  return (
    <aside className="inspector" aria-live="polite" aria-label="DNS Resolution Story">
      <div className="flex items-center justify-between gap-4">
        <div className="inspector-kicker !mb-0">RESOLUTION STORY</div>
        <span className="font-mono text-[10px] tracking-[.1em] text-[var(--color-paper-400)]">
          {String(activeIndex + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
        </span>
      </div>

      <progress
        className="mt-4 h-1 w-full accent-[var(--color-signal)]"
        value={activeIndex + 1}
        max={steps.length}
        aria-label={`Story progress ${activeIndex + 1} of ${steps.length}`}
      />

      <p className="mt-7 mb-2 font-mono text-[10px] tracking-[.12em] text-[var(--color-signal)]">
        {step.eyebrow}
      </p>
      <h2>{step.title}</h2>

      <section className="mt-7 border-t border-[var(--color-ink-700)] pt-5">
        <h3 className="m-0 font-mono text-[10px] tracking-[.1em] text-[var(--color-paper-400)]">QUESTION</h3>
        <p className="mt-2 mb-0 font-mono text-[12px] leading-7 text-[var(--color-paper-50)] break-words">
          {step.question}
        </p>
      </section>

      <section className="mt-6">
        <h3 className="m-0 font-mono text-[10px] tracking-[.1em] text-[var(--color-paper-400)]">WHAT WE LEARN</h3>
        <p className="mt-2 mb-0 text-[12px] leading-7 text-[var(--color-paper-200)]">{step.learned}</p>
      </section>

      <section className="mt-6 border-l border-[color:rgb(130_233_208_/_35%)] pl-4">
        <h3 className="m-0 font-mono text-[10px] tracking-[.1em] text-[var(--color-paper-400)]">WHY NEXT?</h3>
        <p className="mt-2 mb-0 text-[12px] leading-7 text-[var(--color-paper-200)]">{step.whyNext}</p>
      </section>

      <div className="mt-8 grid grid-cols-3 gap-2" aria-label="Story controls">
        <button
          type="button"
          className="min-h-11 border border-[var(--color-ink-700)] bg-transparent px-3 text-[12px] disabled:cursor-not-allowed disabled:opacity-35"
          onClick={onPrevious}
          disabled={atStart}
        >
          戻る
        </button>
        <button
          type="button"
          className="min-h-11 border border-[var(--color-signal)] bg-[color:rgb(130_233_208_/_8%)] px-3 text-[12px] text-[var(--color-signal)]"
          onClick={onTogglePlay}
          aria-pressed={playing}
        >
          {playing ? 'Pause' : atEnd ? 'Replay' : 'Play'}
        </button>
        <button
          type="button"
          className="min-h-11 border border-[var(--color-ink-700)] bg-transparent px-3 text-[12px] disabled:cursor-not-allowed disabled:opacity-35"
          onClick={onNext}
          disabled={atEnd}
        >
          次へ
        </button>
      </div>

      <p className="mt-6 mb-0 font-mono text-[10px] leading-5 text-[var(--color-paper-400)]">
        EXPLANATORY PLAYBACK · Google Public DNSで観測した情報から再構成。実際のパケット順序ではありません。
      </p>
    </aside>
  );
}
