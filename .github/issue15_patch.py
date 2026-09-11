from pathlib import Path
import json


def patch(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    if old not in text:
        raise SystemExit(f'anchor not found in {path}: {old[:120]!r}')
    target.write_text(text.replace(old, new, 1))


# App: initialize and synchronize meaningful entry state with the browser URL.
patch(
    'src/App.tsx',
    "import { exploreDns, type DnsExploration } from './lib/dns';\nimport { buildDnsStory, type DnsStoryStep, type StoryActor } from './lib/story.ts';\n\ntype WorkspaceMode = 'story' | 'compare' | 'lab' | 'explore';",
    "import { exploreDns, type DnsExploration } from './lib/dns';\nimport { parseShareState, serializeShareState, type ShareMode } from './lib/shareState.ts';\nimport { buildDnsStory, type DnsStoryStep, type StoryActor } from './lib/story.ts';\n\ntype WorkspaceMode = ShareMode;",
)
patch(
    'src/App.tsx',
    "export function App() {\n  const [query, setQuery] = useState('google.com');",
    "export function App() {\n  const initialShareState = useMemo(() => parseShareState(window.location.search), []);\n  const [query, setQuery] = useState(initialShareState.host);",
)
patch(
    'src/App.tsx',
    "  const [mode, setMode] = useState<WorkspaceMode>('story');",
    "  const [mode, setMode] = useState<WorkspaceMode>(initialShareState.mode);",
)
patch(
    'src/App.tsx',
    "  const [compareLeft, setCompareLeft] = useState('google.com');\n  const [compareRight, setCompareRight] = useState('github.com');",
    "  const [compareLeft, setCompareLeft] = useState(initialShareState.left);\n  const [compareRight, setCompareRight] = useState(initialShareState.right);",
)
patch(
    'src/App.tsx',
    "  const [labSection, setLabSection] = useState<LabSection>('cache');",
    "  const [labSection, setLabSection] = useState<LabSection>(initialShareState.lab);",
)
patch(
    'src/App.tsx',
    "  useEffect(() => {\n    void runExploration('google.com');\n    return () => {\n      controllerRef.current?.abort();\n      compareControllerRef.current?.abort();\n    };\n  }, [runExploration]);",
    "  useEffect(() => {\n    if (initialShareState.mode === 'compare') {\n      void runComparison(initialShareState.left, initialShareState.right);\n    } else {\n      void runExploration(initialShareState.host);\n    }\n\n    return () => {\n      controllerRef.current?.abort();\n      compareControllerRef.current?.abort();\n    };\n  }, [initialShareState, runComparison, runExploration]);\n\n  useEffect(() => {\n    if (mode === 'compare') {\n      if (!comparison) return;\n      const search = serializeShareState({\n        mode,\n        host: initialShareState.host,\n        left: comparison.left.hostname,\n        right: comparison.right.hostname,\n        lab: labSection,\n      });\n      window.history.replaceState(null, '', `${window.location.pathname}${search}${window.location.hash}`);\n      return;\n    }\n\n    if (!exploration) return;\n    const search = serializeShareState({\n      mode,\n      host: exploration.hostname,\n      left: compareLeft,\n      right: compareRight,\n      lab: labSection,\n    });\n    window.history.replaceState(null, '', `${window.location.pathname}${search}${window.location.hash}`);\n  }, [compareLeft, compareRight, comparison, exploration, initialShareState.host, labSection, mode]);",
)
patch(
    'src/App.tsx',
    "  const enterStory = () => setMode('story');\n  const enterLab = () => {\n    setMode('lab');\n    setPlaying(false);\n  };\n  const enterExplore = () => {\n    setMode('explore');\n    setPlaying(false);\n  };",
    "  const ensureSingleExploration = () => {\n    if (!exploration && !loading) void runExploration(query);\n  };\n  const enterStory = () => {\n    setMode('story');\n    setPlaying(false);\n    ensureSingleExploration();\n  };\n  const enterLab = () => {\n    setMode('lab');\n    setPlaying(false);\n    ensureSingleExploration();\n  };\n  const enterExplore = () => {\n    setMode('explore');\n    setPlaying(false);\n    ensureSingleExploration();\n  };",
)
patch(
    'src/App.tsx',
    '      <ModeButton active={mode === \'lab\'} title="Lab" description="TTLを時間で動かす" onClick={onLab} />',
    '      <ModeButton active={mode === \'lab\'} title="Lab" description="cacheと失敗を実験" onClick={onLab} />',
)

# Public/product contracts for shareable entry points.
patch(
    'PRODUCT.md',
    '- Accept a URL or hostname and normalize it to a DNS hostname.',
    '- Accept a URL or hostname and normalize it to a DNS hostname.\n- Reflect the current successful learning entry point in a shareable browser URL: hostname + mode for Story/Lab/Explore, comparison pair for Compare, and Lab subsection where relevant. Invalid URL state must fall back through the same hostname normalization rules rather than bypassing them.',
)
patch(
    'PRODUCT.md',
    '- No authentication or persistence is required for the current learning experience.',
    '- No authentication or persistence is required for the current learning experience. Shareable URL state is navigation state only and must not become query history or saved progress.',
)
patch(
    'docs/ARCHITECTURE.md',
    '- `src/lib/domain.ts`: input normalization and DNS namespace decomposition. No UI state or network I/O.',
    '- `src/lib/domain.ts`: input normalization and DNS namespace decomposition. No UI state or network I/O.\n- `src/lib/shareState.ts`: pure parsing/serialization of shareable entry state. Hostnames are validated through `normalizeHostname`; malformed URL state falls back to product defaults and never initiates a query with an unvalidated hostname.',
)
patch(
    'docs/ARCHITECTURE.md',
    '- `src/App.tsx`: request lifecycle, cancellation, learning-mode state, Story interaction/feedback state, local Auto scheduling, optional CNAME sample entry action, Compare request coordination, Lab composition, Explore selection synchronization, and page composition.',
    '- `src/App.tsx`: request lifecycle, cancellation, learning-mode state, Story interaction/feedback state, local Auto scheduling, optional CNAME sample entry action, Compare request coordination, Lab composition, Explore selection synchronization, share-URL synchronization via `history.replaceState`, and page composition.',
)

# E2E: URL round-trip, compare, Lab subsection, invalid fallback.
path = Path('tests/e2e/rendered.spec.ts')
text = path.read_text()
anchor = "test('Story advances by directly activating the next protocol handoff', async ({ page }) => {"
if anchor not in text:
    raise SystemExit('share E2E insertion anchor missing')
share_tests = r'''test('share URL opens a normalized Story hostname and round-trips committed state', async ({ page }) => {
  await page.goto('/?mode=story&host=https%3A%2F%2FWWW.GITHUB.COM%2Fdocs');
  await expect(page.getByRole('button', { name: /Story/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('探索するURLまたはドメイン')).toHaveValue('www.github.com');
  await expect(page.getByRole('heading', { name: '最初に質問を渡す相手を選ぶ' })).toBeVisible();
  await expect.poll(() => new URL(page.url()).search).toBe('?mode=story&host=www.github.com');
});

test('share URL opens a comparison pair', async ({ page }) => {
  await page.goto('/?mode=compare&left=google.com&right=github.com');
  await expect(page.getByRole('button', { name: /Compare/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('比較する1つ目のURLまたはドメイン')).toHaveValue('google.com');
  await expect(page.getByLabel('比較する2つ目のURLまたはドメイン')).toHaveValue('github.com');
  await expect(page.getByRole('heading', { name: /com\. までは共通/ })).toBeVisible();
  await expect.poll(() => new URL(page.url()).search).toBe('?mode=compare&left=google.com&right=github.com');
});

test('share URL opens Break DNS and invalid URL state falls back safely', async ({ page }) => {
  await page.goto('/?mode=lab&host=google.com&lab=failure');
  await expect(page.getByRole('button', { name: /^Lab/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('BREAK DNS · SIMULATION')).toBeVisible();
  await expect.poll(() => new URL(page.url()).search).toBe('?mode=lab&host=google.com&lab=failure');

  await page.goto('/?mode=unknown&host=localhost&lab=other');
  await expect(page.getByRole('button', { name: /Story/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('探索するURLまたはドメイン')).toHaveValue('google.com');
  await expect.poll(() => new URL(page.url()).search).toBe('?mode=story&host=google.com');
});

'''
path.write_text(text.replace(anchor, share_tests + anchor, 1))

# Release metadata.
package_path = Path('package.json')
package = json.loads(package_path.read_text())
package['version'] = '1.0.0'
package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + '\n')

lock_path = Path('package-lock.json')
lock = json.loads(lock_path.read_text())
lock['version'] = '1.0.0'
lock['packages']['']['version'] = '1.0.0'
lock_path.write_text(json.dumps(lock, ensure_ascii=False, indent=2) + '\n')
