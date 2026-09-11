# Internet Anatomy

Interactive Internet protocol learning through real observations and explanatory models.

The current DNS experience has three lenses:

- **Story** — stay in one protocol theater, choose the next reachable DNS actor, and learn why responsibility moves there.
- **Compare** — overlay two names onto the same DNS hierarchy and see where responsibility diverges.
- **Explore** — inspect the observed namespace, NS/SOA data, and final records directly.

Story and Compare are explanatory projections reconstructed from DNS data observed through Google Public DNS. They are not packet captures or a trace of the device's actual recursive resolver exchange.

## Run locally

```bash
npm ci
npm run dev
```

## Quality gates

```bash
npm run check
npm run typecheck
npm test
npm run build
npm run test:e2e
```
