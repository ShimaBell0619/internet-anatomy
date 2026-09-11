import type { DnsStoryStep, StoryActor } from '../lib/story.ts';
import '../story.css';

export interface StoryFeedback {
  kind: 'success' | 'hint';
  title: string;
  text: string;
  detail?: string;
}

interface DnsStoryProps {
  steps: DnsStoryStep[];
  activeIndex: number;
  playing: boolean;
  complete: boolean;
  feedback: StoryFeedback | null;
  onSelectActor: (actorId: StoryActor['id']) => void;
  onBack: () => void;
  onTogglePlay: () => void;
  onReplay: () => void;
  onExplore: () => void;
}

export function DnsStory({
  steps,
  activeIndex,
  playing,
  complete,
  feedback,
  onSelectActor,
  onBack,
  onTogglePlay,
  onReplay,
  onExplore,
}: DnsStoryProps) {
  const step = steps[activeIndex] ?? steps[0];
  if (!step) return null;

  if (complete) {
    return (
      <section className="story-theater story-complete" aria-label="DNS Resolution Story complete">
        <div className="story-complete-mark" aria-hidden="true">DNS</div>
        <div className="min-w-0">
          <p className="mb-2 font-mono text-[9px] tracking-[.11em] text-[var(--color-signal)]">STORY COMPLETE</p>
          <h2 className="m-0 text-[clamp(26px,4vw,48px)] leading-[1.05] font-semibold tracking-[-.045em]">
            名前解決のバトンが、端末へ戻りました。
          </h2>
          <p className="mt-4 max-w-3xl text-[13px] leading-7 text-[var(--color-paper-200)]">
            RootがIPを全部知っているのではなく、Resolverが管理境界を順番にたどり、得たAnswerをClientへ返す流れを体験しました。
          </p>
        </div>
        <div className="story-complete-actions">
          <button
            type="button"
            className="min-h-10 rounded-[4px] border border-[var(--color-ink-700)] bg-[var(--color-ink-850)] px-4 text-[11px]"
            onClick={onReplay}
          >
            もう一度
          </button>
          <button
            type="button"
            className="min-h-10 rounded-[4px] border border-[var(--color-signal)] bg-[var(--color-signal)] px-4 text-[11px] font-bold text-[#07231d]"
            onClick={onExplore}
          >
            実データをExplore
          </button>
        </div>
        <StoryDisclosure />
      </section>
    );
  }

  const choices = orderChoices(step);
  const feedbackTone = feedback?.kind === 'success'
    ? 'border-t-[color:rgb(130_233_208_/_42%)]'
    : feedback?.kind === 'hint'
      ? 'border-t-[color:rgb(240_200_121_/_42%)]'
      : 'border-t-[var(--color-ink-700)]';
  const feedbackLabelTone = feedback?.kind === 'success'
    ? 'text-[var(--color-signal)]'
    : feedback?.kind === 'hint'
      ? 'text-[var(--color-warm)]'
      : 'text-[var(--color-paper-400)]';

  return (
    <section className="story-theater" aria-label="DNS Resolution Story">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-3 border-b border-[var(--color-ink-700)] bg-[color:rgb(14_17_23_/_92%)] px-[18px] py-[14px] max-[560px]:gap-x-2 max-[560px]:px-3 max-[560px]:py-2.5">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[9px] tracking-[.09em] text-[var(--color-signal)] max-[560px]:text-[7px]">
            <span>SCENE {String(activeIndex + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span>
            <span>{step.eyebrow}</span>
          </div>
          <h2 id="story-question" className="m-0 text-[clamp(18px,2.1vw,30px)] leading-[1.12] font-semibold tracking-[-.035em]">
            {step.action.instruction}
          </h2>
          <p className="mt-1.5 mb-0 max-w-4xl text-[12px] leading-5 text-[var(--color-paper-200)] max-[560px]:text-[10px] max-[560px]:leading-4">
            {step.question}
          </p>
        </div>

        <div className="flex self-center gap-2 max-[560px]:grid max-[560px]:grid-cols-1 max-[560px]:gap-1">
          <button
            type="button"
            className="min-h-9 rounded-[4px] border border-[var(--color-ink-700)] bg-[var(--color-ink-850)] px-3 text-[10px] disabled:cursor-not-allowed disabled:opacity-30 max-[560px]:min-h-7 max-[560px]:px-2 max-[560px]:text-[8px]"
            onClick={onBack}
            disabled={activeIndex === 0}
          >
            戻る
          </button>
          <button
            type="button"
            className="min-h-9 rounded-[4px] border border-[var(--color-ink-700)] bg-[var(--color-ink-850)] px-3 text-[10px] aria-pressed:border-[var(--color-signal)] aria-pressed:text-[var(--color-signal)] max-[560px]:min-h-7 max-[560px]:px-2 max-[560px]:text-[8px]"
            onClick={onTogglePlay}
            aria-pressed={playing}
          >
            {playing ? 'Auto停止' : 'Autoで見る'}
          </button>
        </div>

        <ol className="col-span-2 m-0 flex list-none gap-1 p-0" aria-label={`Story progress ${activeIndex + 1} of ${steps.length}`}>
          {steps.map((item, index) => (
            <li
              key={item.id}
              className={`h-0.5 flex-1 ${index < activeIndex ? 'bg-[color:rgb(130_233_208_/_48%)]' : index === activeIndex ? 'bg-[var(--color-signal)]' : 'bg-[var(--color-ink-700)]'}`}
              aria-current={index === activeIndex ? 'step' : undefined}
            >
              <span className="sr-only">Scene {index + 1}</span>
            </li>
          ))}
        </ol>
      </header>

      <div className="story-stage" aria-describedby="story-question">
        <ActorSource actor={step.action.source} hostname={extractHostname(steps)} />

        <div className="story-handoff" aria-hidden="true">
          <span>HANDOFF</span>
          <i />
        </div>

        <div className="min-w-0">
          <p className="mb-2 font-mono text-[9px] tracking-[.1em] text-[var(--color-paper-400)] max-[560px]:mb-1 max-[560px]:text-[7px]">
            次に到達できる相手は？
          </p>
          <fieldset className="story-target-grid m-0 border-0 p-0">
            <legend className="sr-only">次に質問または答えを渡す相手</legend>
            {choices.map((choice) => (
              <ActorButton
                key={choice.actor.id}
                actor={choice.actor}
                guided={playing && choice.actor.id === step.action.target.id}
                onClick={() => onSelectActor(choice.actor.id)}
              />
            ))}
          </fieldset>
        </div>
      </div>

      <div className={`grid min-h-[96px] grid-cols-[150px_minmax(0,1fr)] items-center gap-[18px] border-t bg-[color:rgb(14_17_23_/_94%)] px-[18px] py-3 ${feedbackTone} max-[560px]:min-h-0 max-[560px]:grid-cols-1 max-[560px]:gap-1 max-[560px]:px-2.5 max-[560px]:py-2`} aria-live="polite" aria-atomic="true">
        <div className={`font-mono text-[9px] tracking-[.1em] ${feedbackLabelTone} max-[560px]:text-[8px]`}>
          {feedback?.kind === 'success' ? 'WHAT JUST HAPPENED' : feedback?.kind === 'hint' ? 'WHY NOT YET?' : 'TOUCH THE MODEL'}
        </div>
        <div className="min-w-0">
          {feedback ? (
            <>
              <strong className="mb-0.5 block text-[12px] font-semibold max-[560px]:text-[10px]">{feedback.title}</strong>
              <p className="m-0 text-[10px] leading-[1.55] text-[var(--color-paper-200)] max-[560px]:text-[9px] max-[560px]:leading-[1.4]">{feedback.text}</p>
              {feedback.detail && (
                <small className="mt-0.5 block font-mono text-[9px] leading-[1.45] text-[var(--color-paper-400)] max-[560px]:text-[8px] max-[560px]:leading-[1.35]">
                  WHY NEXT · {feedback.detail}
                </small>
              )}
            </>
          ) : (
            <>
              <strong className="mb-0.5 block text-[12px] font-semibold max-[560px]:text-[10px]">見えているDNS actorを選んで進めます。</strong>
              <p className="m-0 text-[10px] leading-[1.55] text-[var(--color-paper-200)] max-[560px]:text-[9px] max-[560px]:leading-[1.4]">
                早すぎる相手を選んでも失敗にはしません。なぜ今そこへ行けないかを、この場所で説明します。
              </p>
            </>
          )}
        </div>
      </div>

      <StoryDisclosure />
    </section>
  );
}

function ActorSource({ actor, hostname }: { actor: StoryActor; hostname: string }) {
  return (
    <section className="story-source" aria-label={`現在の役割: ${actor.role} ${actor.name}`}>
      <p className="m-0 font-mono text-[9px] tracking-[.11em] text-[var(--color-paper-400)] max-[560px]:col-span-2 max-[560px]:text-[7px]">CURRENT HOLDER</p>
      <ActorIdentity actor={actor} />
      <div className="story-baton">
        <span>EXPLANATORY BATON</span>
        <strong>{hostname} ?</strong>
      </div>
    </section>
  );
}

function ActorButton({ actor, guided, onClick }: { actor: StoryActor; guided: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className="story-actor-button"
      data-guided={guided ? 'true' : 'false'}
      onClick={onClick}
      aria-label={`${actor.role} ${actor.name}`}
    >
      <ActorIdentity actor={actor} compact />
      {guided && <span className="absolute right-2 bottom-1.5 font-mono text-[7px] tracking-[.08em] text-[var(--color-signal)] max-[560px]:hidden">AUTO NEXT</span>}
    </button>
  );
}

function ActorIdentity({ actor, compact = false }: { actor: StoryActor; compact?: boolean }) {
  return (
    <span className="grid min-w-0 gap-1 max-[560px]:gap-0.5">
      <small className="min-w-0 break-words font-mono text-[8px] tracking-[.1em] text-[var(--color-signal)] max-[560px]:text-[7px] max-[560px]:tracking-[.05em]">{actor.role}</small>
      <strong className="min-w-0 break-words font-mono text-[clamp(10px,1.5vw,18px)] leading-tight font-medium text-[var(--color-paper-50)]">{actor.name}</strong>
      <span className={`min-w-0 break-words font-mono text-[9px] leading-[1.45] text-[var(--color-paper-400)] max-[560px]:text-[7px] max-[560px]:leading-[1.3] ${compact ? 'max-[560px]:hidden' : ''}`}>{actor.detail}</span>
    </span>
  );
}

function StoryDisclosure() {
  return (
    <p className="m-0 border-t border-[color:rgb(40_48_60_/_65%)] bg-[color:rgb(9_11_15_/_88%)] px-[18px] py-1.5 font-mono text-[8px] leading-[1.45] text-[var(--color-paper-400)] max-[560px]:px-2.5 max-[560px]:py-1 max-[560px]:text-[7px]">
      EXPLANATORY MODEL · Google Public DNSで観測したレコードから再構成。表示するhandoffは実パケットの捕捉や実測hopではありません。
    </p>
  );
}

function orderChoices(step: DnsStoryStep): Array<{ actor: StoryActor }> {
  const alternatives = step.action.alternatives.map((item) => ({ actor: item.actor }));
  const target = { actor: step.action.target };
  const first = alternatives[0];
  const second = alternatives[1];

  if (first && second) return [first, target, second];
  if (first) return [target, first];
  return [target];
}

function extractHostname(steps: DnsStoryStep[]): string {
  const client = steps[0]?.action.source;
  return client?.kind === 'client' ? client.detail.replace(/\s*\?$/, '') : 'hostname';
}
