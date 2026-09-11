# Internet Anatomy

**See what happens behind a URL.** Internet Anatomy is an interactive learning tool that turns real Internet protocol data into an explorable visual model.

The current surface focuses on DNS. Enter one or two hostnames and learn through three complementary modes:

- **Story** — the default interactive protocol theater. Stay in one scene, choose the next meaningful DNS actor, and learn immediately what happened and why the responsibility handoff continues. If the observed answer contains CNAME, Story makes the alias → canonical-name detour explicit before the terminal address.
- **Compare** — place two hostnames under the same DNS lens. See the shared namespace trunk, the first responsibility divergence, and each domain-specific branch.
- **Explore** — inspect the observed DNS namespace, NS/SOA information, and final A / AAAA / CNAME answers directly.

## Current behavior

- Starts Story with `google.com` and Compare with `google.com` / `github.com` as useful live examples.
- Offers `www.github.com` as a restrained CNAME example so the name-to-name handoff can be explored without changing the simple default.
- Reads real DNS data from the Google Public DNS DNS-over-HTTPS JSON API.
- Keeps normal Story scenes in a mostly viewport-fixed stage so the question, DNS actors, and explanation remain in one visual context.
- Advances Story primarily by selecting visible DNS actors rather than pressing a generic Next button.
- Explains premature actor choices with causal `WHY NOT YET?` feedback instead of scoring them as failures.
- Shows `WHAT JUST HAPPENED` / `WHY NEXT` feedback after a valid handoff, with Back and an optional Auto watch mode as secondary controls.
- Reconstructs observed CNAME chains from Answer record owner names and CNAME targets, preserving which name actually owns a terminal A/AAAA record.
- Stops malformed CNAME cycles finitely and leaves alias-without-terminal-address outcomes explicit instead of inventing an address.
- Compares two current DNS explorations to show shared Root/TLD ancestry, the first divergence point, downstream delegation evidence, and final answers.
- Shows Root/TLD/namespace stages, observed NS/SOA data, and final A/AAAA/CNAME records with TTL in Explore.
- Distinguishes NODATA, NXDOMAIN, DNS protocol failures, and transport errors.
- Stores no query or comparison history in the application.

> Queried hostnames are sent from your browser to Google Public DNS. Story and Compare are explanatory reconstructions from observed DNS data. Story handoff arrows, CNAME detour rails, and Auto progression are not packet captures, measured hop timing, reproductions of your operating system's resolver path, or proof that the browser separately queried each canonical target.

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
