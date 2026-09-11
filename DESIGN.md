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

Design direction: **a quiet network microscope where one real query becomes a causal story and invisible DNS responsibility passes visibly from one layer to the next.**

The first glance must answer three questions in order: what hostname is being explored, which resolution step is active now, and why the next DNS layer is needed. Raw records and namespace details remain available through Explore, but they are secondary to the initial learning story.

Avoid generic dashboard composition. Internet Anatomy is an exploration/learning surface, not a KPI console: no equal metric-card grid, marketing hero, decorative icon boxes, or repeated pills without protocol meaning.

## Colors

- `ink-950` / `ink-900` / `ink-850`: depth of the exploration workspace; dark surfaces reduce competition with protocol data.
- `paper-50` / `paper-200` / `paper-400`: primary, secondary, and metadata text.
- `signal`: active path, focus, current Story step, and observed delegation emphasis.
- `warm`: final answer records; distinguishes returned records from namespace structure without relying on color alone.
- `danger`: explicit query/error state only.
- Dark appearance is the initial product decision. Accent glow is limited to active/temporal network state and is not general decoration.

## Typography

- Sans-serif carries Japanese explanation and interface text.
- Monospace carries domain names, record types, TTL, protocol metadata, stage labels, and Story route labels such as `RESOLVER → ROOT`.
- The queried hostname, current Story question, and DNS path have higher visual weight than supporting explanation.
- Do not ship a webfont solely for styling; use system/CJK-capable fallbacks and validate Japanese wrapping in rendered review.

## Layout

- Wide screens use a primary DNS path canvas plus a narrower contextual panel.
- Story is the default mode; the contextual panel owns the current question, learned fact, why-next explanation, progress, and playback controls.
- Explore reuses the same canvas and contextual panel for direct record/stage inspection instead of creating a second dashboard.
- The path is vertically ordered to mirror increasing DNS-name specificity rather than forcing a decorative graph layout.
- At narrow widths the canvas and contextual panel stack; Story controls remain together and record values wrap instead of introducing horizontal scrolling.
- Query input stays above the workspace and remains the dominant input action. Story/Explore is a compact mode choice, not application navigation chrome.
- Supporting resolver/disclosure text compresses and wraps before the primary path does.

## Elevation & Depth

- Use borders, surface tone, and a subtle coordinate grid to separate the exploration canvas from the contextual panel.
- Avoid card-per-stage elevation. DNS nodes live in one continuous namespace rather than independent floating surfaces.
- The contextual panel may be sticky on wide screens because it represents the current selection or Story step.

## Shapes

- Use restrained small radii for inputs and data rows.
- Namespace stages are rectilinear, technical markers; avoid generic pill/badge styling.
- Circular motion is reserved for a real loading/observation state.

## Components

- Native input/button/progress semantics are sufficient for current controls; do not add a primitive dependency until behavior requires it.
- Product semantic components own Query Bar, DNS Path, Stage Node, Answer Record, Story, and Inspector behavior.
- Story state changes must visibly select the corresponding path stage or final answer. Explanation must not advance independently from the main visualization.
- Directly selecting a path node while Story is active may move the user into Explore so the Story narrative and arbitrary inspection state cannot contradict each other.
- Specialist CSS is explicitly allowed for the path/rail/grid visualization because it expresses protocol structure better than generic cards.
- Loading, error, selected, playing/paused, empty/NODATA, and successful answer states must be explicit.

## Motion

- Play advances discrete Story steps; it is not presented as packet timing or measured network duration.
- Step focus may use short positional/color transitions to orient the eye, but `prefers-reduced-motion` must collapse those transitions.
- Do not animate fabricated packets between DNS servers when the application did not observe those packets.

## Do's and Don'ts

### Do

- Make the current causal question and selected DNS path state agree.
- Explain each Story transition with “what we learned” and “why next”.
- Label observed values with textual protocol roles (`ROOT`, `TLD`, `NS`, `A`, `AAAA`, `CNAME`, `TTL`).
- Keep focus visible and selection understandable without color alone.
- Preserve real strings and allow long DNS values to wrap.
- Use motion only to communicate active learning state and respect reduced-motion preferences.
- Review 1440px, 390px, and 320px renderings.

### Don't

- Do not imply that Story playback is the user's actual recursive resolver trace or a packet capture.
- Do not let playback timing imply measured DNS latency.
- Do not turn protocol types into decorative badges unrelated to their semantics.
- Do not add side navigation, KPI cards, user profile chrome, or generic SaaS dashboard structure without a product need.
- Do not hide explanatory content behind hover-only interactions.
- Do not sacrifice readable Japanese explanation to preserve a desktop composition.
