from pathlib import Path


def patch(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    if old not in text:
        raise SystemExit(f'anchor not found in {path}: {old[:100]!r}')
    target.write_text(text.replace(old, new, 1))


patch(
    'src/App.tsx',
    "import { DnsCacheLab } from './components/DnsCacheLab';",
    "import { DnsLab, type LabSection } from './components/DnsLab';",
)
patch(
    'src/App.tsx',
    "  const [compareError, setCompareError] = useState<string | null>(null);",
    "  const [compareError, setCompareError] = useState<string | null>(null);\n  const [labSection, setLabSection] = useState<LabSection>('cache');",
)
patch(
    'src/App.tsx',
    '                    <span className="max-[560px]:block">TTLを進めると、</span>\n                    <span className="max-[560px]:block">必要な経路が</span>\n                    <span className="max-[560px]:block">変わっていく。</span>',
    '                    <span className="max-[560px]:block">条件を変えると、</span>\n                    <span className="max-[560px]:block">DNSの経路と</span>\n                    <span className="max-[560px]:block">失敗が見えてくる。</span>',
)
patch(
    'src/App.tsx',
    "                    ? '観測したTTLを種にしたローカルシミュレーションで、再問い合わせがcacheによりどこまで短縮されるかを動かして確かめます。'",
    "                    ? 'Cache / TTLとBreak DNSのローカルシミュレーションで、同じDNS模型の条件を変え、経路が短縮・停止・ループする理由を確かめます。'",
)
patch(
    'src/App.tsx',
    "                  ? 'Labは観測したTTLを初期値にしたローカルシミュレーションです。実Resolver cacheの観測ではありません。'",
    "                  ? 'Labはローカルシミュレーションです。実DNSの変更、実Resolver cacheの観測、実packet traceではありません。'",
)
patch(
    'src/App.tsx',
    '              {!loading && exploration && <DnsCacheLab exploration={exploration} />}\n              {!loading && !exploration && !error && (\n                <p className="empty-state p-8">ドメインを探索してCache / TTL Labを開始してください。</p>\n              )}',
    '              {!loading && exploration && (\n                <DnsLab exploration={exploration} section={labSection} onSectionChange={setLabSection} />\n              )}\n              {!loading && !exploration && !error && (\n                <p className="empty-state p-8">ドメインを探索してDNS Labを開始してください。</p>\n              )}',
)

patch(
    'PRODUCT.md',
    '- Experiment job: use **Lab** to change modeled DNS conditions and observe how resolution behavior changes. Cache / TTL Lab uses observed TTL values only as simulation seeds.',
    '- Experiment job: use **Lab** to change modeled DNS conditions and observe how resolution behavior changes. Cache / TTL uses observed TTL values only as simulation seeds; Break DNS changes only a local failure model.',
)
patch(
    'PRODUCT.md',
    '- Let the learner advance simulated time by expiring answer or delegation entries directly. The Lab must show simulated time, modeled cache entries, original TTLs, remaining TTLs, and the route that would be needed for the next lookup.',
    '- Let the learner advance simulated time by expiring answer or delegation entries directly. The Lab must show simulated time, modeled cache entries, original TTLs, remaining TTLs, and the route that would be needed for the next lookup.\n- Provide Break DNS in the same Lab surface. Let the learner switch a local model among working, NODATA, NXDOMAIN, missing-delegation, and finite CNAME-loop conditions and see exactly where the modeled path terminates or stops.\n- Break DNS must distinguish NODATA (name exists but requested data is absent) from NXDOMAIN (name itself does not exist), and must never mutate or claim to mutate real DNS.',
)
patch(
    'PRODUCT.md',
    'A Cache / TTL Lab state transition must be produced by pure local simulation logic. The initial TTL seeds may come from the current exploration, but lookup kind, remaining TTL, cache fill, and expiry must not depend on React layout or additional network requests.',
    'A Cache / TTL Lab state transition must be produced by pure local simulation logic. The initial TTL seeds may come from the current exploration, but lookup kind, remaining TTL, cache fill, and expiry must not depend on React layout or additional network requests.\n\nA Break DNS state must also be produced by pure local simulation logic. Working, NODATA, NXDOMAIN, missing delegation, and CNAME-loop outcomes are teaching models only; they perform no additional DNS request and never modify external DNS. Loop projections must stop finitely.',
)

patch(
    'DESIGN.md',
    '- Lab controls are direct experiment controls (`query`, expire answer, expire delegation, reset), not quiz answers.',
    '- Lab controls are direct experiment controls, not quiz answers. Cache / TTL exposes query/expiry/reset actions; Break DNS exposes working/NODATA/NXDOMAIN/missing-delegation/CNAME-loop conditions as model mutations.',
)
patch(
    'DESIGN.md',
    '- Loading, error, active actor, explanatory feedback, shared, diverged, alias/canonical, cache-valid/cache-expired, empty/NODATA, and successful answer states must be explicit.',
    '- Loading, error, active actor, explanatory feedback, shared, diverged, alias/canonical, cache-valid/cache-expired, NODATA, NXDOMAIN, missing-delegation, finite-loop, and successful answer states must be explicit.',
)

patch(
    'docs/ARCHITECTURE.md',
    '        Pure local cache lifecycle model\n```',
    '        Pure local cache lifecycle model\n        └─ local Break DNS failure-model projection\n```',
)
patch(
    'docs/ARCHITECTURE.md',
    '- `src/lib/cacheLab.ts`: pure derivation of Cache / TTL Lab seed and local lifecycle transitions; no network I/O or React state.',
    '- `src/lib/cacheLab.ts`: pure derivation of Cache / TTL Lab seed and local lifecycle transitions; no network I/O or React state.\n- `src/lib/failureLab.ts`: pure derivation of working/NODATA/NXDOMAIN/missing-delegation/CNAME-loop teaching states. It performs no network I/O and loops terminate finitely.\n- `src/components/DnsLab.tsx` / `DnsFailureLab.tsx`: Lab experiment switch and Break DNS presentation; UI consumes pure model output rather than deriving failure semantics from layout.',
)
patch(
    'docs/ARCHITECTURE.md',
    '## Failure model\n',
    '## Break DNS Lab model\n\n- Break DNS runs entirely in the browser against a local teaching model; it does not mutate DNS or issue scenario-specific network requests.\n- `working` reaches a terminal modeled answer. `nodata` keeps the name present but removes terminal A/AAAA. `nxdomain` models the queried name itself as absent. `missing-delegation` stops before an authoritative boundary can be reached. `cname-loop` returns to a previously visited alias and then terminates with an explicit STOP node.\n- These states are semantic teaching projections, not claims about the currently observed public domain.\n\n## Failure model\n',
)

patch(
    'README.md',
    '- **Lab** — change modeled DNS conditions and observe the consequence. Cache / TTL Lab uses observed TTL values as local simulation inputs to show when repeated lookups can stop at cache or must reopen part of the DNS path.',
    '- **Lab** — change modeled DNS conditions and observe the consequence. Cache / TTL shows how cached clues shorten later work; Break DNS safely models NODATA, NXDOMAIN, missing delegation, and finite CNAME loops without modifying real DNS.',
)
patch(
    'README.md',
    '- Shows original and remaining TTL values, simulated time, and the route required for the next modeled lookup.',
    '- Shows original and remaining TTL values, simulated time, and the route required for the next modeled lookup.\n- Lets you break only the local DNS model to distinguish NODATA from NXDOMAIN, stop at a missing delegation, or create a finite CNAME loop and see where resolution can no longer advance.',
)

path = Path('tests/e2e/rendered.spec.ts')
text = path.read_text()
anchor = "test('Cache TTL Lab preserves state meaning with reduced motion', async ({ page }) => {"
if anchor not in text:
    raise SystemExit('E2E insertion anchor missing')
failure_test = r'''test('Break DNS Lab exposes causal failure states without quiz mechanics', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.getByRole('button', { name: /^Lab/ }).click();
  await page.getByRole('button', { name: /Break DNS/ }).click();

  await expect(page.getByText('BREAK DNS · SIMULATION')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'DNSを壊すと、どこで止まる？' })).toBeVisible();
  await expect(page.getByText('WORKING', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'A / AAAAを外す' }).click();
  await expect(page.getByText('NOERROR / NODATA', { exact: true })).toBeVisible();
  await expect(page.getByText(/NXDOMAIN/).last()).toBeVisible();

  await page.getByRole('button', { name: '名前自体を消す' }).click();
  await expect(page.getByText('NXDOMAIN', { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: '委任を外す' }).click();
  await expect(page.getByText('DELEGATION MISSING', { exact: true })).toBeVisible();
  await expect(page.getByLabel(/Break DNS route/).getByText('AUTHORITATIVE', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'CNAME loopを作る' }).click();
  await expect(page.getByText('CNAME LOOP', { exact: true })).toBeVisible();
  await expect(page.getByText('visited name', { exact: true })).toBeVisible();
  expect(await hasHorizontalOverflow(page)).toBe(false);
});

'''
path.write_text(text.replace(anchor, failure_test + anchor, 1))

text = path.read_text()
mobile_anchor = "  test(`keeps Cache TTL Lab causal state readable without horizontal overflow at ${width}px`, async ({ page }) => {"
if mobile_anchor not in text:
    raise SystemExit('mobile E2E insertion anchor missing')
mobile_test = r'''  test(`keeps Break DNS readable without horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.getByRole('button', { name: /^Lab/ }).click();
    await page.getByRole('button', { name: /Break DNS/ }).click();
    await page.getByRole('button', { name: 'CNAME loopを作る' }).click();

    await expect(page.getByText('CNAME LOOP', { exact: true })).toBeVisible();
    await expect(page.getByText('visited name', { exact: true })).toBeVisible();
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

'''
path.write_text(text.replace(mobile_anchor, mobile_test + mobile_anchor, 1))
