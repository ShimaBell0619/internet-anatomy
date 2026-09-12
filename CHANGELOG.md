# Changelog

## 1.0.0 — 2026-09-12

Internet Anatomy v1.0 ships the first complete DNS learning experience.

### Learning surfaces

- **Story**: a mostly viewport-fixed protocol theater where the learner directly activates the next reachable DNS responsibility handoff instead of paging through a lesson or answering a quiz.
- **CNAME Story**: observed alias → canonical-name → terminal-address ownership is revealed progressively, including finite cycle/missing-terminal handling.
- **Compare**: compare exactly two real hostnames to see their shared DNS namespace ancestry and the first point where responsibility diverges.
- **Cache / TTL Lab**: explicit local simulation seeded from observed TTL values, showing answer-cache hits, delegation-cache reuse, and route reopening after expiry.
- **Break DNS Lab**: local working/NODATA/NXDOMAIN/missing-delegation/CNAME-loop models that reveal where resolution stops or loops without changing real DNS.
- **Explore**: direct inspection of observed NS/SOA/A/AAAA/CNAME records and reconstructed namespace stages.

### Experience

- Direct-manipulation Story flow with short semantic handoff motion and equivalent reduced-motion states.
- Responsive review baselines at approximately 1440px, 390px, and 320px.
- Keyboard-reachable native controls, visible focus, and textual state that does not depend on color or motion alone.
- Shareable URL entry state for hostname + mode, comparison pairs, and Lab subsection, with the same hostname validation used by typed input.

### Data and trust boundary

- Real DNS observations come from the Google Public DNS JSON DNS-over-HTTPS API.
- Story and Compare remain explanatory projections, not packet captures or the user's real resolver trace.
- Cache / TTL and Break DNS remain local simulations, not visibility into Google Public DNS cache state and not DNS mutations.
- No authentication, backend, database, analytics, or saved history is introduced in v1.0.
