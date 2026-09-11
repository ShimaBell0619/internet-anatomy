import { useState, type ReactNode } from 'react';
import { buildFailureLabModel, type FailureScenario } from '../lib/failureLab.ts';
import '../failure-lab.css';

export function DnsFailureLab({ hostname }: { hostname: string }) {
  const [scenario, setScenario] = useState<FailureScenario>('working');
  const model = buildFailureLabModel(hostname, scenario);

  return (
    <section className="failure-lab" aria-labelledby="failure-lab-title">
      <header className="failure-lab-header">
        <div>
          <p className="m-0 font-mono text-[9px] tracking-[.12em] text-[var(--color-danger)]">BREAK DNS · SIMULATION</p>
          <h2 id="failure-lab-title" className="mt-2 mb-0 text-[clamp(24px,3vw,40px)] leading-[1.05] font-semibold tracking-[-.045em]">
            DNSを壊すと、どこで止まる？
          </h2>
          <p className="mt-3 mb-0 max-w-3xl text-[12px] leading-6 text-[var(--color-paper-200)]">
            実DNSは変更しません。{hostname} を使ったローカル模型の条件だけを変え、経路が止まる位置と応答の意味を比べます。
          </p>
        </div>
        <div className="failure-status" data-tone={scenario === 'working' ? 'normal' : 'failure'} role="status">
          <span>MODEL OUTCOME</span>
          <strong>{model.status}</strong>
        </div>
      </header>

      <fieldset className="failure-controls">
        <legend className="sr-only">Break DNS scenarios</legend>
        <ScenarioButton active={scenario === 'working'} onClick={() => setScenario('working')}>正常へ戻す</ScenarioButton>
        <ScenarioButton active={scenario === 'nodata'} onClick={() => setScenario('nodata')}>A / AAAAを外す</ScenarioButton>
        <ScenarioButton active={scenario === 'nxdomain'} onClick={() => setScenario('nxdomain')}>名前自体を消す</ScenarioButton>
        <ScenarioButton active={scenario === 'missing-delegation'} onClick={() => setScenario('missing-delegation')}>委任を外す</ScenarioButton>
        <ScenarioButton active={scenario === 'cname-loop'} onClick={() => setScenario('cname-loop')}>CNAME loopを作る</ScenarioButton>
      </fieldset>

      <div className="failure-lab-grid">
        <div className="failure-route-panel">
          <span className="failure-kicker">SIMULATED RESOLUTION PATH</span>
          <ol className="failure-route" data-scenario={scenario} aria-label={`Break DNS route: ${model.status}`}>
            {model.nodes.map((item, index) => (
              <li key={`${scenario}-${index}-${item.role}-${item.name}`}>
                <div className="failure-node" data-tone={item.tone}>
                  <span>{item.role}</span>
                  <strong>{item.name}</strong>
                </div>
                {index < model.nodes.length - 1 && <i aria-hidden="true" data-tone={item.tone} />}
              </li>
            ))}
          </ol>
        </div>

        <aside className="failure-explanation" aria-live="polite">
          <span className="failure-kicker">WHAT CHANGED</span>
          <h3>{model.title}</h3>
          <p>{model.explanation}</p>
          <div className="failure-distinction">
            <span>DON'T CONFUSE</span>
            <p>{model.distinction}</p>
          </div>
        </aside>
      </div>

      <p className="failure-disclosure">
        SIMULATION · この操作は実DNSを変更せず、外部DNSへの追加問い合わせも行いません。経路・停止位置・loopは学習用のローカル模型です。
      </p>
    </section>
  );
}

function ScenarioButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick}>
      {children}
    </button>
  );
}
