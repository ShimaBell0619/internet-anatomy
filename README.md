# Internet Anatomy

**See what happens behind a URL.** Internet Anatomy is an interactive learning tool that turns real Internet protocol data into an explorable visual model.

The current surface focuses on DNS. Enter one or two hostnames and learn through four complementary modes:

- **Story** — the default interactive protocol theater. Directly activate each reachable DNS handoff and see what changed and why. If the observed answer contains CNAME, Story makes the alias → canonical-name detour explicit before the terminal address.
- **Compare** — place two hostnames under the same DNS lens. See the shared namespace trunk, the first responsibility divergence, and each domain-specific branch.
- **Lab** — change modeled DNS conditions and observe the consequence. Cache / TTL shows how cached clues shorten later work; Break DNS safely models NODATA, NXDOMAIN, missing delegation, and finite CNAME loops without modifying real DNS.
- **Explore** — inspect the observed DNS namespace, NS/SOA information, and final A / AAAA / CNAME answers directly.

## Current behavior

- Starts Story with `google.com` and Compare with `google.com` / `github.com` as useful live examples.
- Offers `www.github.com` as a restrained CNAME example so the name-to-name handoff can be explored without changing the simple default.
- Reads real DNS data from the Google Public DNS DNS-over-HTTPS JSON API.
- Keeps normal Story scenes in a mostly viewport-fixed stage so the question, DNS actors, and explanation remain in one visual context.
- Advances Story by directly activating the currently reachable DNS actor instead of presenting a multiple-choice correctness loop.
- Uses short semantic motion only to orient state changes; `prefers-reduced-motion` preserves the same information without spatial animation.
- Shows `WHAT JUST HAPPENED` / `WHY NEXT` feedback after each handoff, with Back and an optional Auto watch mode as secondary controls.
- Reconstructs observed CNAME chains from Answer record owner names and CNAME targets, preserving which name actually owns a terminal A/AAAA record.
- Stops malformed CNAME cycles finitely and leaves alias-without-terminal-address outcomes explicit instead of inventing an address.
- Compares two current DNS explorations to show shared Root/TLD ancestry, the first divergence point, downstream delegation evidence, and final answers.
- Simulates resolver caching locally: first lookup fills modeled answer/delegation cache, a valid answer cache collapses the next route to the Resolver, answer expiry can reuse delegation state, and delegation expiry reopens the full modeled path.
- Shows original and remaining TTL values, simulated time, and the route required for the next modeled lookup.
- Lets you break only the local DNS model to distinguish NODATA from NXDOMAIN, stop at a missing delegation, or create a finite CNAME loop and see where resolution can no longer advance.
- Shows Root/TLD/namespace stages, observed NS/SOA data, and final A/AAAA/CNAME records with TTL in Explore.
- Distinguishes NODATA, NXDOMAIN, DNS protocol failures, and transport errors.
- Reflects successful entry state in the browser URL so a hostname/mode, comparison pair, or Lab subsection can be shared directly.
- Stores no query history, lesson progress, comparison history, or Lab history in the application.

## Shareable entry points

The URL stores only stable entry state—not Story progress, cache clock, or a temporary Break DNS scenario.

```text
?mode=story&host=www.github.com
?mode=compare&left=google.com&right=github.com
?mode=lab&host=google.com&lab=failure
?mode=explore&host=google.com
```

Hostnames loaded from URL state are validated through the same normalization path as typed input. Invalid URL state falls back to the product defaults.

> Queried hostnames are sent from your browser to Google Public DNS. Story and Compare are explanatory reconstructions from observed DNS data. Lab is a local simulation seeded by observed values. Story/Lab route graphics, CNAME detour rails, and Auto progression are not packet captures, measured hop timing, reproductions of your operating system's resolver path, or visibility into Google Public DNS cache contents.

## Development

Requires Node.js `24.20.0` and npm.

```bash
npm ci
npm run dev
```

Quality gates:

```bash
npm run check
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

## Foundation

This repository adopts `ShimaBell0619/web-app-foundation` v0.8.1. See `docs/FOUNDATION.md`, `PRODUCT.md`, `DESIGN.md`, and `AGENTS.md` before material changes.
