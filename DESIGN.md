---
version: alpha
name: Internet Anatomy
description: Visual and interaction contract for an interactive Internet protocol learning tool.
omitted:
  - section: components
    reason: Product components are introduced only when a repeated interaction pattern justifies them.
---

# Design System

## Overview

Design direction: **a quiet protocol theater where real DNS observations become directly manipulable responsibility handoffs, Compare exposes where two names branch, and Lab lets the learner alter model conditions without pretending they are live telemetry.**

Story is not a vertically stacked article. One scene should keep the current question, current responsibility holder, reachable DNS actors, and immediate feedback in one visual context. The learner advances by touching the model rather than paging through explanation. When CNAME is observed, the same stage visibly detours from an alias name to a canonical name before the terminal address. Compare remains a contrastive full-width lens. Lab reuses the technical stage language for explicit simulations. Explore remains the detailed inspection surface.

Avoid generic dashboard composition. Internet Anatomy is an exploration/learning surface, not a KPI console: no equal metric-card grid, marketing hero in the primary Story flow, decorative icon boxes, or repeated pills without protocol meaning.

## Colors

- `ink-950` / `ink-900` / `ink-850`: depth of the exploration workspace; dark surfaces reduce competition with protocol data.
- `paper-50` / `paper-200` / `paper-400`: primary, secondary, and metadata text.
- `signal`: active/shared path, current holder/actor focus, observed delegation emphasis, and valid modeled cache state.
- `warm`: final answer records, Compare divergence, CNAME detour emphasis, Lab simulation/time emphasis, and explanatory “not yet” feedback; never the sole signal for correctness or state.
- `danger`: explicit query/error or modeled failure state only, not a learner choosing an actor too early.
- Dark appearance is the initial product decision. Accent glow is limited to active/temporal network state and is not general decoration.

## Typography

- Sans-serif carries Japanese explanation and interface text.
- Monospace carries domain names, record types, TTL, protocol metadata, actor roles, Story scene metadata, alias-chain ownership, Compare branch labels, Lab clocks, and modeled cache states.
- In Story, the current action/question dominates; explanatory feedback is concise and secondary.
- CNAME scenes must spell out owner name, `CNAME`, canonical target, and terminal A/AAAA owner/value in text. The detour must remain understandable without its line geometry or color.
- Lab must label `SIMULATION`, modeled time, original TTL, remaining TTL, and route state in text so color/motion is supplemental.
- Do not ship a webfont solely for styling; use system/CJK-capable fallbacks and validate Japanese wrapping in rendered review.

## Layout

- Story uses a mostly viewport-fixed **protocol theater** instead of the normal document flow. Its normal scene should not require page-level vertical scrolling at the target desktop/mobile review heights.
- Story chrome is intentionally compressed: topbar, hostname query, and learning-mode choice must not displace the learning stage.
- A normal Story scene reads as **current holder → explanatory handoff → reachable actors**, with the action question above and contextual feedback below. These regions remain visible together.
- A CNAME scene may add one compact **observed alias chain rail** inside that same stage. The rail reinforces that the path has turned from one DNS name to another; it must not push the question, actors, or feedback out of the normal viewport.
- Story may hide raw records and secondary facts. Explore owns detailed NS/SOA/Answer inspection and may use document scrolling when needed.
- Story target actors are visible controls, not invisible hotspots. Click/tap/keyboard provide the complete progression path; drag-and-drop is not required.
- Compare uses the full workspace width and reads top-to-bottom as shared trunk → explicit divergence → two domain branches, not as two unrelated result cards.
- Lab uses one causal stage rather than a grid of lesson cards. For Cache / TTL, the next modeled query route dominates and the Resolver cache state is a secondary inspector beside/below it.
- At narrow widths, Story rearranges the same scene rather than stacking a long article. Current holder and target actors remain above the feedback boundary without horizontal scrolling.
- At narrow widths, CNAME rail items may wrap compactly, but the alias owner and canonical target must remain readable rather than being reduced to decorative marks.
- At narrow widths, Lab turns the route into a vertical causal path and moves cache state below it. It must not rely on horizontal scrolling to preserve the route.
- Compare, Lab, and Explore retain their responsive reading order rather than being forced into the Story viewport constraint.

## Elevation & Depth

- Use borders, surface tone, and a subtle coordinate grid to create one continuous technical stage.
- Avoid card-per-step elevation. Story actors and Lab route nodes are protocol markers inside one model, not independent content cards.
- CNAME is a detour inside the same stage, not a new modal/card/page. A warm rail/boundary may distinguish alias resolution from delegation without creating a second visual system.
- Compare line/rail continuity should express shared ancestry and branching more strongly than containers do.
- Lab route continuity should make path collapse/re-open more legible than the cache inspector containers.
- Explore may retain its canvas/inspector separation because selection context benefits from a persistent detail surface.

## Shapes

- Use restrained small radii for inputs and actionable actor nodes.
- Namespace/actor/Lab route nodes are rectilinear technical markers; avoid generic pill/badge styling.
- CNAME chain items use the same rectilinear technical language as the stage; they are evidence labels, not status chips.
- Circular motion is reserved for a real loading/observation state.

## Components

- Native input/button/fieldset semantics are sufficient for current controls; do not add a primitive dependency until behavior requires it.
- Product semantic components own Query Bar, DNS Path, Story Theater/Actor/Alias Trail, Compare, Lab, Answer Record, and Inspector behavior.
- Story interaction semantics come from the pure Story model: current holder, reachable target, contextual alternatives, and any observed alias-chain projection. Layout must not decide the next actor; the default Story UI exposes the reachable target directly instead of rendering alternatives as a correctness test.
- Activating the visible target advances the responsibility model and leaves concise **WHAT JUST HAPPENED / WHY NEXT** feedback in the same scene context.
- Story progression is not a quiz. The learner should not need to choose among plausible-but-unreachable actors to prove knowledge before seeing the protocol change.
- CNAME progression treats the alias name and canonical name as distinct selectable actors. A canonical A/AAAA address is presented as owned by the canonical record name, never visually reassigned to the original alias.
- Alias-chain cycles and missing terminal addresses are explicit labeled outcomes, not generic errors or inferred addresses.
- Auto is a secondary watch mode. It may highlight the next actor, but manual Story must not reveal the answer solely through color or animation.
- Compare must render from a pure comparison model derived from two current DNS explorations; UI layout must not decide shared ancestry or divergence semantics.
- Cache / TTL Lab must render from a pure simulation model. UI controls alter modeled time/cache state; layout must not decide whether a lookup is a full resolution, delegation-cache hit, or answer-cache hit.
- Lab controls are direct experiment controls (`query`, expire answer, expire delegation, reset), not quiz answers.
- Shared/branch/interaction/simulation meaning must be textual as well as visual. Color and line placement may reinforce meaning but cannot be the only signal.
- Specialist custom CSS is allowed only where the protocol-stage/rail/handoff/Lab route visualization materially benefits from it. Routine controls, responsive text, focus, disabled state, field grouping, and button behavior stay with semantic HTML/Tailwind or mature primitives.
- Loading, error, active actor, explanatory feedback, shared, diverged, alias/canonical, cache-valid/cache-expired, empty/NODATA, and successful answer states must be explicit.

## Motion

- Auto advances discrete explanatory Story scenes using local UI time only; it is not DNS latency.
- Manual Story interaction uses immediate state change plus short semantic orientation transitions: source emphasis arrives, the handoff rail reveals, the reachable target appears, and an active CNAME rail item may reveal. These transitions should remain roughly sub-300ms and must never block the next action.
- Cache / TTL Lab may briefly reveal the route nodes/rails that become necessary after a modeled state change. Motion communicates path collapse/re-open; it must never imply observed packet travel or real resolver timing.
- The memorable CNAME moment comes from the information structure changing from name → name → address, reinforced by a brief reveal rather than elaborate animation.
- `prefers-reduced-motion` must remove nonessential actor/focus/route transitions while preserving the identical textual state and route structure.
- Do not animate fabricated packets between DNS servers or CNAME targets. Handoff/route lines describe explanatory or simulated relationships, not observed traffic.

## Do's and Don'ts

### Do

- Keep Story question, manipulated actors, and resulting explanation in one visual context.
- Let protocol semantics drive navigation when a visible DNS actor can represent the next action accessibly.
- Make the reachable handoff target explicit enough to manipulate directly; learning comes from causing and observing the state change, not from guessing a correct option.
- Make the current holder and selectable actors distinguishable through labels, structure, focus, and text—not color alone.
- Make a CNAME turn memorable by clearly showing **alias name → CNAME → canonical name → A/AAAA**, with record ownership intact.
- In Compare, expose the shared prefix before differences and emphasize the first responsibility boundary.
- In Lab, make the modeled condition and resulting route visible together so the learner can connect cause to effect.
- Label simulation/model state prominently whenever the UI is not showing an observed external fact.
- Preserve real strings and allow long DNS values to wrap.
- Review 1440px, 390px, and 320px renderings, including actual viewport height/clipping rather than only width overflow.

### Don't

- Do not turn Story or Lab into a quiz, score loop, streak system, or generic gamified lesson.
- Do not make a generic Next button the primary progression mechanism when the protocol actor itself can be selected.
- Do not require drag-and-drop for core progression.
- Do not imply that Story, CNAME detours, Compare, or Lab simulation is the user's actual recursive resolver trace or a packet capture.
- Do not imply that Cache / TTL Lab exposes Google Public DNS cache state, age, hit/miss telemetry, or measured timing.
- Do not let Auto or Lab animation timing imply measured DNS latency.
- Do not turn actor/alias/Lab route nodes into decorative cards whose visual weight is unrelated to protocol meaning.
- Do not relabel a canonical A/AAAA record as if the original alias name owned it.
- Do not invent an authoritative/delegation zone or terminal address when the observed evidence is missing.
- Do not rebuild standard inputs, buttons, focus handling, field grouping, or keyboard behavior in specialist CSS/JS simply to look unique.
- Do not sacrifice readable Japanese explanation to preserve a desktop composition.
