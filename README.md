# Internet Anatomy

**See what happens behind a URL.** Internet Anatomy is an interactive learning tool that turns real Internet protocol data into an explorable visual model.

The current surface focuses on DNS. Enter one or two hostnames and learn through three complementary modes:

- **Story** — the default guided playback. Follow why a Recursive Resolver consults Root, TLD, delegated/authoritative DNS, receives an answer, and returns it to the client.
- **Compare** — place two hostnames under the same DNS lens. See the shared namespace trunk, the first responsibility divergence, and each domain-specific branch.
- **Explore** — inspect the observed DNS namespace, NS/SOA information, and final A / AAAA / CNAME answers directly.

## Current behavior

- Starts Story with `google.com` and Compare with `google.com` / `github.com` as useful live examples.
- Reads real DNS data from the Google Public DNS DNS-over-HTTPS JSON API.
- Builds an explanatory Resolution Story from the observed data, with Previous / Next and Play / Pause controls.
- Keeps the active Story step synchronized with the shared DNS path visualization.
- Compares two current DNS explorations to show shared Root/TLD ancestry, the first divergence point, downstream delegation evidence, and final answers.
- Shows Root/TLD/namespace stages, observed NS/SOA data, and final A/AAAA/CNAME records with TTL in Explore.
- Distinguishes NODATA, NXDOMAIN, DNS protocol failures, and transport errors.
- Stores no query or comparison history in the application.

> Queried hostnames are sent from your browser to Google Public DNS. Story and Compare are explanatory reconstructions from observed DNS data; they are not packet captures, measured hop timing, or reproductions of your operating system's resolver path.

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
