import { useCallback, useEffect, useRef, useState } from 'react';
import { DnsInspector } from './components/DnsInspector';
import { DnsPath, type ExplorerSelection } from './components/DnsPath';
import { QueryBar } from './components/QueryBar';
import { exploreDns, type DnsExploration } from './lib/dns';

export function App() {
  const [query, setQuery] = useState('google.com');
  const [exploration, setExploration] = useState<DnsExploration | null>(null);
  const [selection, setSelection] = useState<ExplorerSelection>({ kind: 'stage', index: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const runExploration = useCallback(async (value: string) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError(null);
    setExploration(null);
    setSelection({ kind: 'stage', index: 0 });

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
          <h1 id="page-title">名前から、Internetの入口をたどる。</h1>
          <p className="hero-copy">
            URLを1つ入力するだけで、RootからTLD、委任されたDNSゾーン、最終レコードまでを実データで観察します。
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
          <span>表示経路は観測したレコードから再構成した学習モデルです。パケットキャプチャではありません。</span>
        </div>
      </section>

      {error && (
        <section className="error-strip" role="alert">
          <strong>探索できませんでした。</strong>
          <span>{error}</span>
          <button type="button" onClick={() => void runExploration(query)}>再試行</button>
        </section>
      )}

      <section className="workspace" aria-busy={loading}>
        <div className="canvas-panel">
          <div className="canvas-header">
            <div>
              <span className="canvas-label">DNS NAMESPACE</span>
              <strong>{exploration?.hostname ?? 'Resolving…'}</strong>
            </div>
            {exploration && (
              <div className="canvas-stats" aria-label="探索情報">
                <span>{exploration.stages.length} steps</span>
                <span>{Math.round(exploration.elapsedMs)} ms</span>
              </div>
            )}
          </div>

          <div className="canvas-body">
            {loading && <LoadingState />}
            {!loading && exploration && (
              <DnsPath exploration={exploration} selection={selection} onSelect={setSelection} />
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
              <h2>{loading ? 'DNSを問い合わせています' : 'ステップを選択'}</h2>
              <p className="inspector-lead">各ノードを選ぶと、そのDNS階層が何を担当しているのかを確認できます。</p>
            </aside>
          )}
        </div>
      </section>

      <footer className="footer-note">
        <span>Internet Anatomy / DNS Explore</span>
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
