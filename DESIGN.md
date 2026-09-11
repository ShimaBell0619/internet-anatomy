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

Design direction: **a quiet network microscope where real DNS observations become causal stories and comparison exposes the exact point where responsibility branches.**

Story should make one name's responsibility handoff understandable. Compare should make two names feel like specimens placed under the same lens: shared DNS ancestry dominates first, then one explicit divergence point, then two name-specific branches. Explore remains the detailed inspection surface.

Avoid generic dashboard composition. Internet Anatomy is an exploration/learning surface, not a KPI console: no equal metric-card grid, marketing hero, decorative icon boxes, or repeated pills without protocol meaning.

## Colors

- `ink-950` / `ink-900` / `ink-850`: depth of the exploration workspace; dark surfaces reduce competition with protocol data.
- `paper-50` / `paper-200` / `paper-400`: primary, secondary, and metadata text.
- `signal`: active/shared path, focus, current Story step, and observed delegation emphasis.
- `warm`: final answer records and Compare divergence; distinguishes branch/answer semantics without relying on color alone.
- `danger`: explicit query/error state only.
- Dark appearance is the initial product decision. Accent glow is limited to active/temporal network state and is not general decoration.

## Typography

- Sans-serif carries Japanese explanation and interface text.
- Monospace carries domain names, record types, TTL, protocol metadata, stage labels, Story route labels, and Compare branch labels.
- The current Story question or Compare responsibility statement has higher visual weight than supporting explanation.
- Do not ship a webfont solely for styling; use system/CJK-capable fallbacks and validate Japanese wrapping in rendered review.

## Layout

- Wide Story/Explore screens use a primary DNS path canvas plus a narrower contextual panel.
- Story is the default mode; the contextual panel owns the current question, learned fact, why-next explanation, progress, and playback controls.
- Explore reuses the same canvas and contextual panel for direct record/stage inspection instead of creating a second dashboard.
- Compare uses the full workspace width. It must read top-to-bottom as shared trunk → explicit divergence → two domain branches, not as two unrelated side-by-side result cards.
- Compare inputs are exactly two named fields. The default pair is immediately useful, but comparison runs only through the existing explicit browser-to-resolver boundary.
- At narrow widths Compare preserves shared trunk and divergence first, then stacks domain branches in reading order. Branch content must not force horizontal scrolling.
- Query input stays above the workspace and remains the dominant input action. Story/Compare/Explore is a compact learning-mode choice, not application navigation chrome.

## Elevation & Depth

- Use borders, surface tone, and a subtle coordinate grid to separate the learning canvas from surrounding chrome.
- Avoid card-per-stage elevation. DNS nodes live in one continuous namespace rather than independent floating surfaces.
- In Compare, line/rail continuity should express shared ancestry and branching more strongly than containers do.
- The Story/Explore contextual panel may be sticky on wide screens because it represents the current selection or Story step.

## Shapes

- Use restrained small radii for inputs and data rows.
- Namespace stages are rectilinear, technical markers; avoid generic pill/badge styling.
- Circular motion is reserved for a real loading/observation state.

## Components

- Native input/button/progress semantics are sufficient for current controls; do not add a primitive dependency until behavior requires it.
- Product semantic components own Query Bar, DNS Path, Stage Node, Answer Record, Story, Compare, and Inspector behavior.
- Story state changes must visibly select the corresponding path stage or final answer. Explanation must not advance independently from the main visualization.
- Directly selecting a path node while Story is active may move the user into Explore so the Story narrative and arbitrary inspection state cannot contradict each other.
- Compare must render from a pure comparison model derived from two current DNS explorations; UI layout must not decide shared ancestry or divergence semantics.
- Shared/branch meaning must be textual as well as visual. Color and line placement may reinforce meaning but cannot be the only signal.
- Specialist CSS is explicitly allowed for path/rail/grid/branch visualization because it expresses protocol structure better than generic cards.
- Loading, error, selected, playing/paused, shared, diverged, empty/NODATA, and successful answer states must be explicit.

## Motion

- Play advances discrete Story steps; it is not presented as packet timing or measured network duration.
- Step focus may use short positional/color transitions to orient the eye, but `prefers-reduced-motion` must collapse those transitions.
- Compare does not animate fabricated packet traffic between branches.

## Do's and Don'ts

### Do

- Make the current causal question or comparison conclusion agree with the visible DNS structure.
- Explain each Story transition with “what we learned” and “why next”.
- In Compare, expose the shared prefix before showing differences; emphasize the first responsibility boundary rather than every record difference equally.
- Label observed values with textual protocol roles (`ROOT`, `TLD`, `NS`, `A`, `AAAA`, `CNAME`, `TTL`).
- Keep focus visible and selection/shared/divergence state understandable without color alone.
- Preserve real strings and allow long DNS values to wrap.
- Review 1440px, 390px, and 320px renderings.

### Don't

- Do not imply that Story or Compare is the user's actual recursive resolver trace or a packet capture.
- Do not let playback or comparison timing imply measured DNS latency.
- Do not turn Compare into two generic cards with duplicated metrics and no shared hierarchy.
- Do not invent an authoritative/delegation zone when downstream NS evidence is missing.
- Do not add side navigation, KPI cards, user profile chrome, or generic SaaS dashboard structure without a product need.
- Do not hide explanatory content behind hover-only interactions.
- Do not sacrifice readable Japanese explanation to preserve a desktop composition.
