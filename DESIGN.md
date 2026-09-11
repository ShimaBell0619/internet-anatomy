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

Design direction: **a quiet protocol theater where real DNS observations become directly manipulable responsibility handoffs, while Compare exposes where two names branch.**

Story is not a vertically stacked article. One scene should keep the current question, current responsibility holder, reachable DNS actors, and immediate feedback in one visual context. The learner advances by touching the model rather than paging through explanation. Compare remains a contrastive full-width lens. Explore remains the detailed inspection surface.

Avoid generic dashboard composition. Internet Anatomy is an exploration/learning surface, not a KPI console: no equal metric-card grid, marketing hero in the primary Story flow, decorative icon boxes, or repeated pills without protocol meaning.

## Colors

- `ink-950` / `ink-900` / `ink-850`: depth of the exploration workspace; dark surfaces reduce competition with protocol data.
- `paper-50` / `paper-200` / `paper-400`: primary, secondary, and metadata text.
- `signal`: active/shared path, current holder/actor focus, and observed delegation emphasis.
- `warm`: final answer records, Compare divergence, and explanatory “not yet” feedback; never the sole signal for correctness or state.
- `danger`: explicit query/error state only, not a learner choosing an actor too early.
- Dark appearance is the initial product decision. Accent glow is limited to active/temporal network state and is not general decoration.

## Typography

- Sans-serif carries Japanese explanation and interface text.
- Monospace carries domain names, record types, TTL, protocol metadata, actor roles, Story scene metadata, and Compare branch labels.
- In Story, the current action/question dominates; explanatory feedback is concise and secondary.
- Do not ship a webfont solely for styling; use system/CJK-capable fallbacks and validate Japanese wrapping in rendered review.

## Layout

- Story uses a mostly viewport-fixed **protocol theater** instead of the normal document flow. Its normal scene should not require page-level vertical scrolling at the target desktop/mobile review heights.
- Story chrome is intentionally compressed: topbar, hostname query, and Story/Compare/Explore mode choice must not displace the learning stage.
- A Story scene reads as **current holder → explanatory handoff → reachable actors**, with the action question above and contextual feedback below. These regions remain visible together.
- Story may hide raw records and secondary facts. Explore owns detailed NS/SOA/Answer inspection and may use document scrolling when needed.
- Story target actors are visible controls, not invisible hotspots. Click/tap/keyboard provide the complete progression path; drag-and-drop is not required.
- Compare uses the full workspace width and reads top-to-bottom as shared trunk → explicit divergence → two domain branches, not as two unrelated result cards.
- At narrow widths, Story rearranges the same scene rather than stacking a long article. Current holder and target actors remain above the feedback boundary without horizontal scrolling.
- Compare and Explore retain their existing responsive reading order rather than being forced into the Story viewport constraint.

## Elevation & Depth

- Use borders, surface tone, and a subtle coordinate grid to create one continuous technical stage.
- Avoid card-per-step elevation. Story actors are actionable nodes inside one protocol model, not independent content cards.
- Compare line/rail continuity should express shared ancestry and branching more strongly than containers do.
- Explore may retain its canvas/inspector separation because selection context benefits from a persistent detail surface.

## Shapes

- Use restrained small radii for inputs and actionable actor nodes.
- Namespace/actor nodes are rectilinear technical markers; avoid generic pill/badge styling.
- Circular motion is reserved for a real loading/observation state.

## Components

- Native input/button/fieldset semantics are sufficient for current controls; do not add a primitive dependency until behavior requires it.
- Product semantic components own Query Bar, DNS Path, Story Theater/Actor, Compare, Answer Record, and Inspector behavior.
- Story interaction semantics come from the pure Story model: current holder, correct next actor, and meaningful premature alternatives. Layout must not decide what is “correct.”
- A correct actor selection advances the responsibility model and leaves concise **WHAT JUST HAPPENED / WHY NEXT** feedback in the same scene context.
- A premature actor selection does not create an error state; it keeps the scene in place and explains **WHY NOT YET?**.
- Auto is a secondary watch mode. It may highlight the next actor, but manual Story must not reveal the answer solely through color or animation.
- Compare must render from a pure comparison model derived from two current DNS explorations; UI layout must not decide shared ancestry or divergence semantics.
- Shared/branch/interaction meaning must be textual as well as visual. Color and line placement may reinforce meaning but cannot be the only signal.
- Specialist custom CSS is allowed only where the protocol-stage/rail/handoff visualization materially benefits from it. Routine controls, responsive text, focus, disabled state, field grouping, and button behavior stay with semantic HTML/Tailwind or mature primitives.
- Loading, error, active actor, explanatory feedback, shared, diverged, empty/NODATA, and successful answer states must be explicit.

## Motion

- Auto advances discrete explanatory Story scenes using local UI time only; it is not DNS latency.
- Manual interaction should use immediate state change and at most short orientation transitions. The learner should never wait for decorative animation before acting again.
- `prefers-reduced-motion` must remove nonessential actor/focus transitions.
- Do not animate fabricated packets between DNS servers. Handoff lines/arrows describe explanatory responsibility, not observed traffic.

## Do's and Don'ts

### Do

- Keep Story question, manipulated actors, and resulting explanation in one visual context.
- Let protocol semantics drive navigation when a visible DNS actor can represent the next action accessibly.
- Explain early choices with causal language instead of “wrong answer” language.
- Make the current holder and selectable actors distinguishable through labels, structure, focus, and text—not color alone.
- In Compare, expose the shared prefix before differences and emphasize the first responsibility boundary.
- Preserve real strings and allow long DNS values to wrap.
- Review 1440px, 390px, and 320px renderings, including actual viewport height/clipping rather than only width overflow.

### Don't

- Do not turn Story into a quiz, score loop, streak system, or generic gamified lesson.
- Do not make a generic Next button the primary progression mechanism when the protocol actor itself can be selected.
- Do not require drag-and-drop for core progression.
- Do not imply that Story or Compare is the user's actual recursive resolver trace or a packet capture.
- Do not let Auto timing imply measured DNS latency.
- Do not turn actor nodes into decorative cards whose visual weight is unrelated to protocol responsibility.
- Do not invent an authoritative/delegation zone when downstream NS evidence is missing.
- Do not rebuild standard inputs, buttons, focus handling, field grouping, or keyboard behavior in specialist CSS/JS simply to look unique.
- Do not sacrifice readable Japanese explanation to preserve a desktop composition.
