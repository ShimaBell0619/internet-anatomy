from pathlib import Path

path = Path('src/components/DnsStory.tsx')
text = path.read_text()
text = text.replace('  const choices = orderChoices(step);\n', '')
text = text.replace('        <ActorSource actor={step.action.source} hostname={hostname} />', '        <ActorSource key={step.action.source.id} actor={step.action.source} hostname={hostname} />')
text = text.replace('        <div className="story-handoff" aria-hidden="true">', '        <div key={`handoff-${step.id}`} className="story-handoff" aria-hidden="true">')
old = '''        <div className="min-w-0">
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
        </div>'''
new = '''        <div className="min-w-0">
          <p className="mb-2 font-mono text-[9px] tracking-[.1em] text-[var(--color-paper-400)] max-[560px]:mb-1 max-[560px]:text-[7px]">
            次のhandoffを起こす
          </p>
          <fieldset className="story-target-grid m-0 border-0 p-0">
            <legend className="sr-only">次に質問または答えを渡す相手</legend>
            <ActorButton
              key={step.action.target.id}
              actor={step.action.target}
              guided={playing}
              onClick={() => onSelectActor(step.action.target.id)}
            />
          </fieldset>
        </div>'''
if old not in text:
    raise SystemExit('DnsStory choice block not found')
text = text.replace(old, new, 1)
text = text.replace("'TOUCH THE MODEL'", "'TOUCH TO HAND OFF'")
text = text.replace('見えているDNS actorを選んで進めます。', '見えている次のactorを触って、handoffを起こします。')
text = text.replace('早すぎる相手を選んでも失敗にはしません。なぜ今そこへ行けないかを、この場所で説明します。', '触るたびに責任のバトンが次のactorへ移り、何が分かったかを同じ舞台で確認できます。')
start = text.find('\nfunction orderChoices(step: DnsStoryStep)')
end = text.find('\nfunction extractHostname', start)
if start == -1 or end == -1:
    raise SystemExit('orderChoices function not found')
text = text[:start] + text[end:]
path.write_text(text)

path = Path('tests/e2e/rendered.spec.ts')
text = path.read_text()
start = text.find("test('Story advances by touching DNS actors")
end = text.find("\ntest('CNAME example", start)
if start == -1 or end == -1:
    raise SystemExit('Story E2E block not found')
replacement = '''test('Story advances by directly activating the next protocol handoff', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');

  await expect(page.getByRole('button', { name: /Story/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: '最初に質問を渡す相手を選ぶ' })).toBeVisible();
  await expect(page.getByText('次のhandoffを起こす')).toBeVisible();
  await expect(page.getByRole('button', { name: /RECURSIVE RESOLVER Resolver/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^ROOT / })).toHaveCount(0);
  expect(await hasPageVerticalScroll(page)).toBe(false);

  await page.getByRole('button', { name: /RECURSIVE RESOLVER Resolver/ }).click();
  await expect(page.getByRole('heading', { name: 'Resolverが次に頼るDNSを選ぶ' })).toBeVisible();
  await expect(page.getByText('WHAT JUST HAPPENED')).toBeVisible();
  await expect(page.getByText(/端末は通常、設定されたRecursive Resolver/)).toBeVisible();
  await expect(page.getByRole('button', { name: /^ROOT / })).toBeVisible();

  await page.getByRole('button', { name: /^ROOT / }).click();
  await expect(page.getByRole('heading', { name: 'Rootの案内を使って次へ進む' })).toBeVisible();
  await expect(page.getByText(/Rootは個々のサイトのIPを全部持つ場所ではなく/)).toBeVisible();
  expect(await hasPageVerticalScroll(page)).toBe(false);
});

test('Story preserves semantic handoff with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');

  const source = page.getByLabel(/現在の役割: CLIENT Your device/);
  await expect(source).toBeVisible();
  expect(await source.evaluate((element) => getComputedStyle(element).animationName)).toBe('none');

  await page.getByRole('button', { name: /RECURSIVE RESOLVER Resolver/ }).click();
  await expect(page.getByRole('heading', { name: 'Resolverが次に頼るDNSを選ぶ' })).toBeVisible();
  await expect(page.getByText('WHAT JUST HAPPENED')).toBeVisible();
  await expect(page.getByRole('button', { name: /^ROOT / })).toBeVisible();
});
'''
text = text[:start] + replacement + text[end:]
text = text.replace("page.getByText('TOUCH THE MODEL')", "page.getByText('TOUCH TO HAND OFF')")
path.write_text(text)

path = Path('PRODUCT.md')
text = path.read_text()
text = text.replace('Primary job: enter a familiar hostname and use **Story** to manipulate a guided DNS responsibility model—see the current holder, choose the next reachable actor, and receive immediate explanation of what happened and why.', 'Primary job: enter a familiar hostname and use **Story** to manipulate a guided DNS responsibility model—see the current holder, directly activate the next reachable handoff, and receive immediate explanation of what changed and why.')
text = text.replace('- Advance Story primarily by selecting the meaningful next DNS actor/action. Generic pagination is not the primary progression mechanism.\n- Explain premature/early selections non-punitively: tell the learner why that actor is not reachable yet instead of scoring the choice as a failure.\n- After a correct selection, reveal concise **WHAT JUST HAPPENED** and **WHY NEXT** feedback while moving the active question to the next responsibility handoff.', '- Advance Story primarily by directly activating the currently reachable DNS actor/action. Generic pagination and multiple-choice correctness loops are not the primary progression mechanism.\n- Do not make the learner guess the next actor to earn progress. Plausible alternatives may remain domain-model context, but the default Story UI exposes the current reachable target as direct manipulation.\n- After activation, reveal concise **WHAT JUST HAPPENED** and **WHY NEXT** feedback while moving the active question to the next responsibility handoff.')
text = text.replace('- Meaningful state must remain understandable without color alone; motion must respect reduced-motion behavior.', '- Meaningful state must remain understandable without color alone; motion must respect reduced-motion behavior. Semantic Story motion must be short, non-blocking, and optional: source emphasis, handoff reveal, target arrival, and alias reveal may animate only to clarify what changed.')
text = text.replace('Its selectable target and premature alternatives are pure domain semantics; the presentation must not infer the next actor from layout position.', 'Its selectable target and contextual alternatives are pure domain semantics; the presentation must not infer the next actor from layout position or turn those alternatives into a quiz by default.')
path.write_text(text)

path = Path('DESIGN.md')
text = path.read_text()
text = text.replace('Story interaction semantics come from the pure Story model: current holder, correct next actor, meaningful premature alternatives, and any observed alias-chain projection. Layout must not decide what is “correct.”', 'Story interaction semantics come from the pure Story model: current holder, reachable target, contextual alternatives, and any observed alias-chain projection. Layout must not decide the next actor; the default Story UI exposes the reachable target directly instead of rendering alternatives as a correctness test.')
text = text.replace('A correct actor selection advances the responsibility model and leaves concise **WHAT JUST HAPPENED / WHY NEXT** feedback in the same scene context.\n- A premature actor selection does not create an error state; it keeps the scene in place and explains **WHY NOT YET?**.', 'Activating the visible target advances the responsibility model and leaves concise **WHAT JUST HAPPENED / WHY NEXT** feedback in the same scene context.\n- Story progression is not a quiz. The learner should not need to choose among plausible-but-unreachable actors to prove knowledge before seeing the protocol change.')
text = text.replace('- Manual interaction should use immediate state change and at most short orientation transitions. The learner should never wait for decorative animation before acting again.\n- The memorable CNAME moment comes from the information structure changing from name → name → address, not from elaborate animation.', '- Manual interaction uses immediate state change plus short semantic orientation transitions: source emphasis arrives, the handoff rail reveals, the reachable target appears, and an active CNAME rail item may reveal. These transitions should remain roughly sub-300ms and must never block the next action.\n- The memorable CNAME moment comes from the information structure changing from name → name → address, reinforced by a brief reveal rather than elaborate animation.')
text = text.replace('- Explain early choices with causal language instead of “wrong answer” language.', '- Make the reachable handoff target explicit enough to manipulate directly; learning comes from causing and observing the state change, not from guessing a correct option.')
path.write_text(text)

path = Path('docs/ARCHITECTURE.md')
text = path.read_text()
text = text.replace('- The pure Story step names the `source`, correct `target`, and meaningful `alternatives`. The UI presents these as visible native buttons; click, touch, and keyboard use the same state transition.\n- Selecting the target produces immediate success feedback from the current step and advances the active responsibility question.\n- Selecting a premature alternative leaves the step unchanged, stops Auto if necessary, and explains why that responsibility boundary is not yet reachable. This is guidance, not a scored wrong answer.', '- The pure Story step names the `source`, reachable `target`, and meaningful contextual `alternatives`. The default UI presents the target as the direct-manipulation control; alternatives stay available to the domain model but are not rendered as a multiple-choice correctness loop. Click, touch, and keyboard use the same state transition.\n- Activating the target produces immediate feedback from the current step and advances the active responsibility question.')
text = text.replace('- Existing focus-visible treatment and semantic buttons/fieldset provide keyboard semantics. Specialist Story CSS is limited to the protocol-stage composition, actor nodes, baton/handoff geometry, alias rail, and fixed viewport behavior.\n- Reduced-motion styling removes nonessential actor transition effects; no synthetic packet animation is introduced.', '- Existing focus-visible treatment and semantic buttons/fieldset provide keyboard semantics. Specialist Story CSS is limited to the protocol-stage composition, actor nodes, baton/handoff geometry, alias rail, fixed viewport behavior, and semantic state-transition motion.\n- Story motion is presentation-only and does not alter domain timing: short transform/opacity/rail reveals orient the learner after a state change and never delay the state transition or imply packet latency.\n- Reduced-motion styling removes those spatial transitions while preserving identical actor, feedback, and Story state; no synthetic packet animation is introduced.')
path.write_text(text)
