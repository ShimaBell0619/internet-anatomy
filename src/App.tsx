import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DnsLab, type LabSection } from './components/DnsLab';
import { DnsCompare, DnsCompareQuery } from './components/DnsCompare';
import { DnsInspector } from './components/DnsInspector';
import { DnsPath, recordKey, type ExplorerSelection } from './components/DnsPath';
import { DnsStory, type StoryFeedback } from './components/DnsStory';
import { QueryBar } from './components/QueryBar';
import { buildDnsComparison, type DnsComparison } from './lib/compare.ts';
import { exploreDns, type DnsExploration } from './lib/dns';
import { parseShareState, serializeShareState, type ShareMode } from './lib/shareState.ts';
import { buildDnsStory, type DnsStoryStep, type StoryActor } from './lib/story.ts';

type WorkspaceMode = ShareMode;

export function App() {
  const initialShareState = useMemo(() => parseShareState(window.location.search), []);
  const [query, setQuery] = useState(initialShareState.host);
  const [exploration, setExploration] = useState<DnsExploration | null>(null);
  const [selection, setSelection] = useState<ExplorerSelection>({ kind: 'stage', index: 0 });
  const [mode, setMode] = useState<WorkspaceMode>(initialShareState.mode);
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyComplete, setStoryComplete] = useState(false);
  const [storyFeedback, setStoryFeedback] = useState<StoryFeedback | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compareLeft, setCompareLeft] = useState(initialShareState.left);
  const [compareRight, setCompareRight] = useState(initialShareState.right);
  const [comparison, setComparison] = useState<DnsComparison | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [labSection, setLabSection] = useState<LabSection>(initialShareState.lab);
  const controllerRef = useRef<AbortController | null>(null);
  const compareControllerRef = useRef<AbortController | null>(null);
  const story = useMemo(() => (exploration ? buildDnsStory(exploration) : []), [exploration]);

  const resetStory = useCallback(() => {
    setStoryIndex(0);
    setStoryComplete(false);
    setStoryFeedback(null);
    setPlaying(false);
  }, []);

  const runExploration = useCallback(async (value: string) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError(null);
    setExploration(null);
    setSelection({ kind: 'stage', index: 0 });
    resetStory();

    try {
      const result = await exploreDns(value, controller.signal);
      if (!controller.signal.aborted) setExploration(result);
    } catch (caught) {
      if (!controller.signal.aborted) {
        setError(caught instanceof Error ? caught.message : 'DNS探索に失敗しました。');
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [resetStory]);

  const runComparison = useCallback(async (leftValue: string, rightValue: string) => {
    compareControllerRef.current?.abort();
    const controller = new AbortController();
    compareControllerRef.current = controller;
    setCompareLoading(true);
    setCompareError(null);
    setComparison(null);

    try {
      const [leftResult, rightResult] = await Promise.all([
        exploreDns(leftValue, controller.signal),
        exploreDns(rightValue, controller.signal),
      ]);
      if (!controller.signal.aborted) {
        setComparison(buildDnsComparison(leftResult, rightResult));
      }
    } catch (caught) {
      if (!controller.signal.aborted) {
        setCompareError(caught instanceof Error ? caught.message : 'DNS比較に失敗しました。');
        setCompareLoading(false);
        controller.abort();
      }
    } finally {
      if (!controller.signal.aborted) setCompareLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialShareState.mode === 'compare') {
      void runComparison(initialShareState.left, initialShareState.right);
    } else {
      void runExploration(initialShareState.host);
    }

    return () => {
      controllerRef.current?.abort();
      compareControllerRef.current?.abort();
    };
  }, [initialShareState, runComparison, runExploration]);

  useEffect(() => {
    if (mode === 'compare') {
      if (!comparison) return;
      const search = serializeShareState({
        mode,
        host: initialShareState.host,
        left: comparison.left.hostname,
        right: comparison.right.hostname,
        lab: labSection,
      });
      window.history.replaceState(null, '', `${window.location.pathname}${search}${window.location.hash}`);
      return;
    }

    if (!exploration) return;
    const search = serializeShareState({
      mode,
      host: exploration.hostname,
      left: compareLeft,
      right: compareRight,
      lab: labSection,
    });
    window.history.replaceState(null, '', `${window.location.pathname}${search}${window.location.hash}`);
  }, [compareLeft, compareRight, comparison, exploration, initialShareState.host, labSection, mode]);

  const syncExploreSelection = useCallback((step: DnsStoryStep) => {
    if (!exploration) return;
    if (step.focus.kind === 'stage') {
      setSelection({ kind: 'stage', index: step.focus.index });
      return;
    }
    const record = exploration.answerRecords[step.focus.index];
    if (record) setSelection({ kind: 'record', key: recordKey(record) });
  }, [exploration]);

  const handleStoryActor = useCallback((actorId: StoryActor['id']) => {
    if (storyComplete) return;
    const step = story[storyIndex];
    if (!step) return;

    if (actorId !== step.action.target.id) {
      const alternative = step.action.alternatives.find((item) => item.actor.id === actorId);
      setPlaying(false);
      setStoryFeedback({
        kind: 'hint',
        title: 'そこへ行くには、まだ手掛かりが足りません。',
        text: alternative?.explanation ?? '現在の管理境界から、まず次の手掛かりを得る必要があります。',
      });
      return;
    }

    syncExploreSelection(step);
    setStoryFeedback({
      kind: 'success',
      title: step.title,
      text: step.learned,
      detail: step.whyNext,
    });

    if (storyIndex >= story.length - 1) {
      setStoryComplete(true);
      setPlaying(false);
      return;
    }
    setStoryIndex((current) => current + 1);
  }, [story, storyComplete, storyIndex, syncExploreSelection]);

  useEffect(() => {
    if (!playing || mode !== 'story' || storyComplete) return;
    const step = story[storyIndex];
    if (!step) return;
    const timer = window.setTimeout(() => handleStoryActor(step.action.target.id), 3000);
    return () => window.clearTimeout(timer);
  }, [handleStoryActor, mode, playing, story, storyComplete, storyIndex]);

  const selectFromCanvas = (nextSelection: ExplorerSelection) => setSelection(nextSelection);

  const enterCompare = () => {
    setMode('compare');
    setPlaying(false);
    if (!comparison && !compareLoading) void runComparison(compareLeft, compareRight);
  };

  const changeCompareInput = (side: 'left' | 'right', value: string) => {
    compareControllerRef.current?.abort();
    setCompareLoading(false);
    setCompareError(null);
    setComparison(null);
    if (side === 'left') setCompareLeft(value);
    else setCompareRight(value);
  };

  const ensureSingleExploration = () => {
    if (!exploration && !loading) void runExploration(query);
  };
  const enterStory = () => {
    setMode('story');
    setPlaying(false);
    ensureSingleExploration();
  };
  const enterLab = () => {
    setMode('lab');
    setPlaying(false);
    ensureSingleExploration();
  };
  const enterExplore = () => {
    setMode('explore');
    setPlaying(false);
    ensureSingleExploration();
  };
  const backStory = () => {
    setPlaying(false);
    setStoryFeedback(null);
    setStoryComplete(false);
    setStoryIndex((current) => Math.max(0, current - 1));
  };
  const tryAliasExample = () => {
    const value = 'www.github.com';
    setQuery(value);
    void runExploration(value);
  };

  const visibleError = mode === 'compare' ? compareError : error;
  const storyMode = mode === 'story';

  return (
    <main className="app-shell" data-story-mode={storyMode ? 'true' : 'false'}>
      <header className="topbar">
        <a className="brand" href="/" aria-label="Internet Anatomy home">
          <span className="brand-mark" aria-hidden="true">IA</span>
          <span>
            <strong>Internet Anatomy</strong>
            <small>DNS Explore</small>
          </span>
        </a>
        <span className="live-source">REAL DNS · EXPLANATORY MODEL</span>
      </header>

      {storyMode ? (
        <>
          <section className="grid grid-cols-[minmax(0,1fr)_minmax(360px,.72fr)] items-center gap-3 max-[900px]:grid-cols-1 max-[900px]:gap-1.5" aria-label="Story controls">
            <QueryBar
              value={query}
              loading={loading}
              compact
              onChange={setQuery}
              onSubmit={() => void runExploration(query)}
            />
            <LearningModeNav compact mode={mode} onStory={enterStory} onCompare={enterCompare} onLab={enterLab} onExplore={enterExplore} />
          </section>

          {error ? (
            <section className="error-strip" role="alert">
              <strong>探索できませんでした。</strong>
              <span>{error}</span>
              <button type="button" onClick={() => void runExploration(query)}>再試行</button>
            </section>
          ) : loading || !exploration ? (
            <section className="story-theater story-loading" aria-busy="true">
              <LoadingState />
            </section>
          ) : (
            <DnsStory
              steps={story}
              activeIndex={storyIndex}
              playing={playing}
              complete={storyComplete}
              feedback={storyFeedback}
              onSelectActor={handleStoryActor}
              onBack={backStory}
              onTogglePlay={() => setPlaying((current) => !current)}
              onReplay={resetStory}
              onExplore={enterExplore}
              onTryAliasExample={tryAliasExample}
            />
          )}
        </>
      ) : (
        <>
          <section className="hero" aria-labelledby="page-title">
            <div>
              <p className="hero-label">See what happens before a connection begins.</p>
              <h1 id="page-title">
                {mode === 'lab' ? (
                  <>
                    <span className="max-[560px]:block">条件を変えると、</span>
                    <span className="max-[560px]:block">DNSの経路と</span>
                    <span className="max-[560px]:block">失敗が見えてくる。</span>
                  </>
                ) : (
                  <>
                    <span className="max-[560px]:block">名前解決を、</span>
                    <span className="max-[560px]:block">役割のバトン</span>
                    <span className="max-[560px]:block">として見る。</span>
                  </>
                )}
              </h1>
              <p className="hero-copy">
                {mode === 'compare'
                  ? '2つの名前を同じDNS階層に重ねると、どこまで責任を共有し、どの委任から別々になるのかが見えてきます。'
                  : mode === 'lab'
                    ? 'Cache / TTLとBreak DNSのローカルシミュレーションで、同じDNS模型の条件を変え、経路が短縮・停止・ループする理由を確かめます。'
                    : '実際のDNSレコードと名前空間を直接選び、NS / SOA / Answerの詳細を掘り下げます。'}
              </p>
            </div>
            {mode === 'compare' ? (
              <DnsCompareQuery
                left={compareLeft}
                right={compareRight}
                loading={compareLoading}
                onLeftChange={(value) => changeCompareInput('left', value)}
                onRightChange={(value) => changeCompareInput('right', value)}
                onSubmit={() => void runComparison(compareLeft, compareRight)}
              />
            ) : (
              <QueryBar value={query} loading={loading} onChange={setQuery} onSubmit={() => void runExploration(query)} />
            )}
            <div className="source-note">
              <span>Resolver: Google Public DNS (DoH)</span>
              <span>·</span>
              <span>{mode === 'compare'
                ? 'Compareは2つの観測結果を同じDNS名前空間に投影した学習モデルです。'
                : mode === 'lab'
                  ? 'Labはローカルシミュレーションです。実DNSの変更、実Resolver cacheの観測、実packet traceではありません。'
                  : 'Exploreは観測したレコードを表示し、名前空間の階層は観測結果から再構成します。'}</span>
            </div>
          </section>

          {visibleError && (
            <section className="error-strip" role="alert">
              <strong>{mode === 'compare' ? '比較できませんでした。' : '探索できませんでした。'}</strong>
              <span>{visibleError}</span>
              <button type="button" onClick={() => mode === 'compare'
                ? void runComparison(compareLeft, compareRight)
                : void runExploration(query)}>
                再試行
              </button>
            </section>
          )}

          <LearningModeNav mode={mode} onStory={enterStory} onCompare={enterCompare} onLab={enterLab} onExplore={enterExplore} />

          {mode === 'compare' ? (
            <section className="compare-workspace" aria-busy={compareLoading}>
              {compareLoading && <CompareLoadingState />}
              {!compareLoading && comparison && <DnsCompare comparison={comparison} />}
              {!compareLoading && !comparison && !compareError && (
                <p className="empty-state p-8">2つのドメインを指定してDNS責任の分岐を比較してください。</p>
              )}
            </section>
          ) : mode === 'lab' ? (
            <section aria-busy={loading}>
              {loading && <LoadingState />}
              {!loading && exploration && (
                <DnsLab exploration={exploration} section={labSection} onSectionChange={setLabSection} />
              )}
              {!loading && !exploration && !error && (
                <p className="empty-state p-8">ドメインを探索してDNS Labを開始してください。</p>
              )}
            </section>
          ) : (
            <section className="workspace" data-mode="explore" aria-busy={loading}>
              <div className="canvas-panel">
                <div className="canvas-header">
                  <div>
                    <span className="canvas-label">DNS NAMESPACE</span>
                    <strong>{exploration?.hostname ?? 'Resolving…'}</strong>
                  </div>
                  {exploration && (
                    <div className="canvas-stats" role="status" aria-label="探索情報">
                      <span>{exploration.stages.length} steps</span>
                      <span>{Math.round(exploration.elapsedMs)} ms</span>
                    </div>
                  )}
                </div>
                <div className="canvas-body">
                  {loading && <LoadingState />}
                  {!loading && exploration && (
                    <DnsPath exploration={exploration} selection={selection} onSelect={selectFromCanvas} />
                  )}
                  {!loading && !exploration && !error && (
                    <p className="empty-state">URLまたはドメインを入力してDNSを探索してください。</p>
                  )}
                </div>
              </div>

              <div className="inspector-panel">
                {exploration ? (
                  <DnsInspector exploration={exploration} selection={selection} />
                ) : (
                  <aside className="inspector inspector-placeholder">
                    <div className="inspector-kicker">LEARN</div>
                    <h2>{loading ? 'DNSを問い合わせています' : 'DNSを探索'}</h2>
                    <p className="inspector-lead">Exploreでは各NS / SOA / Answer recordを直接確認できます。</p>
                  </aside>
                )}
              </div>
            </section>
          )}

          <footer className="footer-note">
            <span>Internet Anatomy / DNS</span>
            <span>問い合わせるホスト名はGoogle Public DNSへ送信されます。アプリ自身は履歴を保存しません。</span>
          </footer>
        </>
      )}
    </main>
  );
}

function LearningModeNav({
  compact = false,
  mode,
  onStory,
  onCompare,
  onLab,
  onExplore,
}: {
  compact?: boolean;
  mode: WorkspaceMode;
  onStory: () => void;
  onCompare: () => void;
  onLab: () => void;
  onExplore: () => void;
}) {
  return (
    <nav className={compact ? 'grid grid-cols-4 gap-1.5' : 'mb-3 grid grid-cols-4 gap-2'} aria-label="DNS learning mode">
      <ModeButton active={mode === 'story'} title="Story" description="触って因果を理解" onClick={onStory} />
      <ModeButton active={mode === 'compare'} title="Compare" description="責任の分岐を比較" onClick={onCompare} />
      <ModeButton active={mode === 'lab'} title="Lab" description="cacheと失敗を実験" onClick={onLab} />
      <ModeButton active={mode === 'explore'} title="Explore" description="実データを掘る" onClick={onExplore} />
    </nav>
  );
}

function ModeButton({ active, title, description, onClick }: {
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
      className="min-w-0 border border-[var(--color-ink-700)] bg-[var(--color-ink-900)] px-4 py-3 text-left aria-pressed:border-[var(--color-signal)] aria-pressed:bg-[color:rgb(130_233_208_/_6%)] max-[560px]:px-1.5 max-[560px]:py-2 max-[560px]:text-center"
    >
      <strong className="block text-[12px] font-semibold max-[560px]:text-[9px]">{title}</strong>
      <span className="mt-1 block text-[10px] text-[var(--color-paper-400)] max-[560px]:hidden">{description}</span>
    </button>
  );
}

function LoadingState() {
  return (
    <div className="loading-state" role="status">
      <span className="loading-pulse" aria-hidden="true" />
      <div>
        <strong>DNS namespaceを観測中</strong>
        <p>Root / NS / SOA / A / AAAA / CNAME を問い合わせています。</p>
      </div>
    </div>
  );
}

function CompareLoadingState() {
  return (
    <div className="loading-state" role="status">
      <span className="loading-pulse" aria-hidden="true" />
      <div>
        <strong>2つのDNS namespaceを比較中</strong>
        <p>共有する階層と、最初に責任が分かれる地点を探しています。</p>
      </div>
    </div>
  );
}
