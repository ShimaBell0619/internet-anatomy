---
version: alpha
name: Internet Anatomy
description: Visual and interaction contract for an interactive Internet protocol learning tool.
omitted:
  - section: components
    reason: Product components are introduced only when the first DNS interaction establishes a durable repeated pattern.
---

# Design System

## Overview

Design direction: **a quiet network microscope where one real query dominates the workspace and invisible DNS structure unfolds as a precise spatial sequence.**

The first glance must answer three questions in order: what hostname is being explored, where it sits in the DNS namespace, and what was actually returned. Educational explanation is secondary and appears in a contextual inspector instead of competing with the visualization.

Avoid generic dashboard composition. Internet Anatomy is an exploration surface, not a KPI console: no equal metric-card grid, marketing hero, decorative icon boxes, or repeated pills without protocol meaning.

## Colors

- `ink-950` / `ink-900` / `ink-850`: depth of the exploration workspace; dark surfaces reduce competition with protocol data.
- `paper-50` / `paper-200` / `paper-400`: primary, secondary, and metadata text.
- `signal`: active path, focus, and observed delegation emphasis.
- `warm`: final answer records; distinguishes returned records from namespace structure without relying on color alone.
- `danger`: explicit query/error state only.
- Dark appearance is the initial product decision. Accent glow is limited to active/temporal network state and is not general decoration.

## Typography

- Sans-serif carries Japanese explanation and interface text.
- Monospace carries domain names, record types, TTL, protocol metadata, and stage labels.
- The queried hostname and DNS path have higher visual weight than supporting explanation.
- Do not ship a webfont solely for styling; use system/CJK-capable fallbacks and validate Japanese wrapping in rendered review.

## Layout

- Wide screens use a primary exploration canvas plus a narrower contextual inspector.
- The path is vertically ordered to mirror increasing DNS-name specificity rather than forcing a decorative graph layout.
- At narrow widths the canvas and inspector stack; the path remains vertical and record values wrap instead of introducing horizontal scrolling.
- Query input stays above the workspace and remains the single dominant action.
- Supporting resolver/disclosure text compresses and wraps before the primary path does.

## Elevation & Depth

- Use borders, surface tone, and a subtle coordinate grid to separate the exploration canvas from the inspector.
- Avoid card-per-stage elevation. DNS nodes live in one continuous namespace rather than independent floating surfaces.
- The inspector may be sticky on wide screens because it represents the current selection layer.

## Shapes

- Use restrained small radii for inputs and data rows.
- Namespace stages are rectilinear, technical markers; avoid generic pill/badge styling.
- Circular motion is reserved for a real loading/observation state.

## Components

- Native input/button semantics are sufficient for the initial controls; do not add a primitive dependency until behavior requires it.
- Product semantic components own Query Bar, DNS Path, Stage Node, Answer Record, and Inspector behavior.
- Specialist CSS is explicitly allowed for the path/rail/grid visualization because it expresses protocol structure better than generic cards.
- Loading, error, selected, empty/NODATA, and successful answer states must be explicit.

## Do's and Don'ts

### Do

- Make the hostname/path the largest information surface.
- Label observed values with textual protocol roles (`ROOT`, `TLD`, `NS`, `A`, `AAAA`, `CNAME`, `TTL`).
- Keep focus visible and selection understandable without color alone.
- Preserve real strings and allow long DNS values to wrap.
- Use motion only to communicate active observation and respect reduced-motion preferences.
- Review 1440px, 390px, and 320px renderings.

### Don't

- Do not imply that Google Public DNS responses are direct packets from authoritative servers.
- Do not turn protocol types into decorative badges unrelated to their semantics.
- Do not add side navigation, KPI cards, user profile chrome, or generic SaaS dashboard structure without a product need.
- Do not hide explanatory content behind hover-only interactions.
- Do not sacrifice readable Japanese explanation to preserve a desktop composition.
