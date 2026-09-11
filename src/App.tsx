import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DnsInspector } from './components/DnsInspector';
import { DnsPath, recordKey, type ExplorerSelection } from './components/DnsPath';
import { DnsStory } from './components/DnsStory';
import { DnsStoryRoute } from './components/DnsStoryRoute';
import { QueryBar } from './components/QueryBar';
import { exploreDns, type DnsExploration } from './lib/dns';
import { buildDnsStory } from './lib/story.ts';

type WorkspaceMode = 'story' | 'explore';

export function App() {
  const [query, setQuery] = useState('google.com');
  const [exploration, setExploration] = useState<DnsExploration | null>(null);
  const [selection, setSelection] = useState<ExplorerSelection>({ kind: 'stage', index: 0 });
  const [mode, setMode] = useState<WorkspaceMode>('story');
  const [storyIndex, setStoryIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const story = useMemo(() => (exploration ? buildDnsStory(exploration) : []), [exploration]);

  const runExploration = useCallback(async (value: string) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError(null);
    setExploration(null);
    setSelection({ kind: 'stage', index: 0 });
    setStoryIndex(0);
    setPlaying(false);

    try {
      const result = await exploreDns(value, controller.signal);
      if (!controller.signal.aborted) {
        setExploration(result);
      }
    } catch (caught) {
      if (!controller.signal.aborted) {
        setError(caught instanceof Error ? caught.message : 'DNS探索に失敗しました。');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void runExploration('google.com');
    return () => controllerRef.current?.abort();
  }, [runExploration]);

  useEffect(() => {
    if (mode !== 'story' || !exploration) return;
    const focus = story[storyIndex]?.focus;
    if (!focus) return;

    if (focus.kind === 'stage') {
      setSelection({ kind: 'stage', index: focus.index });
      return;
    }

    const record = exploration.answerRecords[focus.index];
    if (record) {
      setSelection({ kind: 'record', key: recordKey(record) });
    }
  }, [exploration, mode, story, storyIndex]);

  useEffect(() => {
    if (!playing || mode !== 'story' || story.length === 0) return;
    if (storyIndex >= story.length - 1) {
      setPlaying(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setStoryIndex((current) => Math.min(current + 1, story.length - 1));
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [mode, playing, story.length, storyIndex]);

  const selectFromCanvas = (nextSelection: ExplorerSelection) => {
    if (mode === 'story') {
      setMode('explore');
      setPlaying(false);
    }
    setSelection(nextSelection);
  };

  const toggleStoryPlayback = () => {
    if (story.length === 0) return;
    if (storyIndex === story.length - 1 && !playing) {
      setStoryIndex(0);
      setPlaying(true);
      return;
    }
    setPlaying((current) => !current);
  };

  return (
    <main className="app-shell">
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

      <section className="hero" aria-labelledby="page-title">
        <div>
          <p className="hero-label">See what happens before a connection begins.</p>
          <h1 id="page-title">名前解決を、役割のバトンとして見る。</h1>
          <p className="hero-copy">
            URLを1つ入力すると、Root・TLD・権威DNSが「何を知り、なぜ次へ渡すのか」を実データから組み立てたStoryでたどれます。
          </p>
        </div>
        <QueryBar
          value={query}
          loading={loading}
          onChange={setQuery}
          onSubmit={() => void runExploration(query)}
        />
        <div className="source-note">
          <span>Resolver: Google Public DNS (DoH)</span>
          <span>·</span>
          <span>Storyは観測したレコードから再構成した学習モデルです。実際のパケット順序ではありません。</span>
        </div>
      </section>

      {error && (
        <section className="error-strip" role="alert">
          <strong>探索できませんでした。</strong>
          <span>{error}</span>
          <button type="button" onClick={() => void runExploration(query)}>再試行</button>
        </section>
      )}

      <nav className="mb-3 flex flex-wrap items-stretch gap-2" aria-label="DNS learning mode">
        <button
          type="button"
          aria-pressed={mode === 'story'}
          onClick={() => {
            setMode('story');
            setPlaying(false);
          }}
          className="min-w-36 border border-[var(--color-ink-700)] bg-[var(--color-ink-900)] px-4 py-3 text-left aria-pressed:border-[var(--color-signal)] aria-pressed:bg-[color:rgb(130_233_208_/_6%)]"
        >
          <strong className="block text-[12px] font-semibold">Story</strong>
          <span className="mt-1 block text-[10px] text-[var(--color-paper-400)]">なぜ次へ進むか</span>
        </button>
        <button
          type="button"
          aria-pressed={mode === 'explore'}
          onClick={() => {
            setMode('explore');
            setPlaying(false);
          }}
          className="min-w-36 border border-[var(--color-ink-700)] bg-[var(--color-ink-900)] px-4 py-3 text-left aria-pressed:border-[var(--color-signal)] aria-pressed:bg-[color:rgb(130_233_208_/_6%)]"
        >
          <strong className="block text-[12px] font-semibold">Explore</strong>
          <span className="mt-1 block text-[10px] text-[var(--color-paper-400)]">NS / SOA / Answerを見る</span>
        </button>
      </nav>

      <section className="workspace" data-mode={mode} aria-busy={loading}>
        <div className="canvas-panel">
          <div className="canvas-header">
            <div>
              <span className="canvas-label">{mode === 'story' ? 'RESOLUTION PATH' : 'DNS NAMESPACE'}</span>
              <strong>{exploration?.hostname ?? 'Resolving…'}</strong>
            </div>
            {exploration && (
              <div className="canvas-stats" role="status" aria-label={mode === 'story' ? 'Story進行状況' : '探索情報'}>
                {mode === 'story' ? (
                  <>
                    <span>step {Math.min(storyIndex + 1, story.length)} / {story.length}</span>
                    <span>explanatory</span>
                  </>
                ) : (
                  <>
                    <span>{exploration.stages.length} steps</span>
                    <span>{Math.round(exploration.elapsedMs)} ms</span>
                  </>
                )}
              </div>
            )}
          </div>

          {mode === 'story' && exploration && (
            <DnsStoryRoute steps={story} activeIndex={storyIndex} />
          )}

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
            mode === 'story' ? (
              <DnsStory
                steps={story}
                activeIndex={storyIndex}
                playing={playing}
                onPrevious={() => {
                  setPlaying(false);
                  setStoryIndex((current) => Math.max(0, current - 1));
                }}
                onNext={() => {
                  setPlaying(false);
                  setStoryIndex((current) => Math.min(story.length - 1, current + 1));
                }}
                onTogglePlay={toggleStoryPlayback}
              />
            ) : (
              <DnsInspector exploration={exploration} selection={selection} />
            )
          ) : (
            <aside className="inspector inspector-placeholder">
              <div className="inspector-kicker">LEARN</div>
              <h2>{loading ? 'DNSを問い合わせています' : 'DNSを探索'}</h2>
              <p className="inspector-lead">Storyでは名前解決の因果関係を、Exploreでは各レコードの詳細を確認できます。</p>
            </aside>
          )}
        </div>
      </section>

      <footer className="footer-note">
        <span>Internet Anatomy / DNS</span>
        <span>問い合わせるホスト名はGoogle Public DNSへ送信されます。アプリ自身は履歴を保存しません。</span>
      </footer>
    </main>
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
