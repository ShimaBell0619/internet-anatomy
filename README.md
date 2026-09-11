# Internet Anatomy

**See what happens behind a URL.** Internet Anatomy is an interactive learning tool that turns real Internet protocol data into an explorable visual model.

The first slice is **DNS Explore**: enter a URL or hostname and follow the DNS namespace from Root through TLD/delegated zones to the final A / AAAA / CNAME answers. Select any stage to learn what it means.

## Current behavior

- Starts with `google.com` as a live example.
- Reads real DNS data from the Google Public DNS DNS-over-HTTPS JSON API.
- Shows Root/TLD/namespace stages, observed NS/SOA data, and final A/AAAA/CNAME records with TTL.
- Clearly separates observed DNS answers from the explanatory namespace path reconstructed by the app.
- Stores no query history in the application.

> The queried hostname is sent from your browser to Google Public DNS. The visualization is not a packet capture and does not claim to reproduce your operating system's resolver path.

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
