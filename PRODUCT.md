# Product Contract

Status: active.

## 1. Purpose

Internet Anatomy makes invisible Internet infrastructure understandable through interactive exploration of real protocol data. The current DNS surface helps a user understand not only what records exist, but why responsibility moves from a recursive resolver through Root, TLD, delegated/authoritative DNS, through any observed CNAME alias handoff, and back to the client—and how caching can shorten later lookups.

## 2. Users and primary jobs

- Learners and engineers who want to understand DNS by observing real domains instead of reading only static diagrams.
- Primary job: enter a familiar hostname and use **Story** to manipulate a guided DNS responsibility model—see the current holder, directly activate the next reachable handoff, and receive immediate explanation of what changed and why.
- Alias-learning job: when an observed answer contains CNAME, follow the name-to-name handoff until a canonical name owns the terminal A/AAAA answer, or until the observed chain ends/cycles.
- Contrastive job: use **Compare** with exactly two hostnames to see which DNS layers are shared and the first point where responsibility diverges.
- Experiment job: use **Lab** to change modeled DNS conditions and observe how resolution behavior changes. Cache / TTL Lab uses observed TTL values only as simulation seeds.
- Detail job: use **Explore** to inspect the observed namespace stages, NS/SOA data, and final answer records directly.

## 3. Core behaviors

- Accept a URL or hostname and normalize it to a DNS hostname.
- Query real public DNS data and distinguish observed data from explanatory reconstruction or simulation.
- Default to a guided DNS Resolution Story derived from the current exploration result.
- Present Story as a mostly viewport-fixed protocol theater: the current question, current holder, reachable DNS actors, and immediate feedback stay in one visual context instead of requiring normal page scrolling.
- Advance Story primarily by directly activating the currently reachable DNS actor/action. Generic pagination and multiple-choice correctness loops are not the primary progression mechanism.
- Do not make the learner guess the next actor to earn progress. Plausible alternatives may remain domain-model context, but the default Story UI exposes the current reachable target as direct manipulation.
- After activation, reveal concise **WHAT JUST HAPPENED** and **WHY NEXT** feedback while moving the active question to the next responsibility handoff.
- Provide Back as supporting navigation and Auto as a secondary watch mode. Auto uses local UI timing only and must not imply measured DNS latency.
- Keep Story intentionally selective; detailed NS/SOA/record inspection belongs to Explore.
- Explain the roles of the client, Recursive Resolver, Root, TLD, observed delegation/authoritative zone, final answer, and return to the client.
- When the observed answer contains a CNAME for the queried name, show the alias as a name-to-name detour before a terminal address. The CNAME owner, CNAME target, and terminal A/AAAA owner must remain distinct.
- Follow multiple observed CNAME hops in order. If the observed chain has no terminal A/AAAA, show that outcome explicitly; if it cycles, stop finitely and show the cycle rather than inventing an address.
- Keep `google.com` as the simple default Story and provide a restrained `www.github.com` sample entry point for discovering the CNAME detour.
- Provide Compare for exactly two hostnames, starting from a useful `google.com` / `github.com` pair.
- In Compare, identify the shared DNS namespace prefix, the first divergence point, each name-specific branch, observed downstream delegation evidence, and final answers.
- When TLDs differ, make clear that responsibility diverges at the TLD level rather than implying shared TLD authority.
- Provide Cache / TTL Lab as an explicit local simulation seeded from the current exploration's observed TTL values.
- In Cache / TTL Lab, a first lookup fills modeled answer and delegation cache entries; a repeated lookup with a valid answer entry stays at the Resolver; answer expiry with valid delegation reopens only downstream authoritative work; delegation expiry reopens the full Root / TLD path.
- Let the learner advance simulated time by expiring answer or delegation entries directly. The Lab must show simulated time, modeled cache entries, original TTLs, remaining TTLs, and the route that would be needed for the next lookup.
- Keep Explore available for direct inspection of the DNS namespace from `.` through successively more specific names and observed delegation points.
- Show A, AAAA, CNAME, NS, and SOA data when available, including TTL.
- Explain selected stages and records in Japanese without requiring prior DNS terminology.
- Clear stale results when a new exploration or comparison starts or fails.
- Keep loading, NODATA, NXDOMAIN, invalid-input, DNS-protocol-error, and transport-error states explicit.

## 4. Product constraints

- No authentication or persistence is required for the current learning experience.
- DNS queries are sent directly from the user's browser to the documented public DNS-over-HTTPS resolver. The UI must disclose that boundary.
- Story and Compare are explanatory projections reconstructed from observed DNS data. The app must not claim that either is a packet capture, the user's OS resolver path, or an iterative query performed by the browser.
- Lab is simulation. It must not claim visibility into Google Public DNS cache contents, real resolver cache age, or actual query paths skipped by that resolver.
- Cache / TTL Lab may use observed TTL values as model inputs, but its clock, cache insertion time, expiry, and path collapse/reopen are entirely local state.
- Story handoff lines, actor transitions, CNAME detour rails, Lab route transitions, and Auto progression represent explanatory relationships or model state, not observed packets or measured hop timing.
- A CNAME chain is reconstructed only from observed Answer record owner names and CNAME RDATA. The UI must not imply that the browser directly queried each canonical target.
- Terminal A/AAAA records belong to the record owner actually observed in the DNS response; they must not be relabeled as belonging to the original alias.
- Story and Lab core interactions must remain fully operable by click/tap and keyboard. Drag-and-drop may not be required for progression.
- A failed comparison must never present one new result beside one stale result as if both belong to the same comparison.
- Story should fit its normal scene within approximately one viewport at the rendered-review desktop/mobile baselines; Compare, Lab, and Explore may scroll when their information density requires it.
- Story, Compare, Lab, and Explore must remain keyboard reachable and usable at approximately 1440px, 390px, and 320px widths without horizontal overflow.
- Meaningful state must remain understandable without color alone; motion must respect reduced-motion behavior. Semantic Story/Lab motion must be short, non-blocking, and optional: motion may clarify state change but cannot be required to understand it.

## 5. Non-goals

- Editing or managing DNS zones.
- Capturing raw DNS/UDP packets or observing a real iterative resolver exchange.
- Performing new browser-side DNS requests for each CNAME target solely to make Story look like a trace.
- Observing or benchmarking a real recursive resolver's cache internals, hit rate, eviction policy, or actual cached age.
- Comparing more than two domains in the current Compare capability.
- Performance/latency benchmarking or multi-region probing.
- User accounts, saved projects, scores, streaks, lives, or other gamification systems.
- Making drag-and-drop the required interaction method.
- TCP, TLS, HTTP, CDN, or cloud topology in the current DNS slice.

## 6. Acceptance boundaries

A DNS capability is supported only when its semantics are documented, representative success and failure transformations are tested, the rendered flow is validated at desktop/mobile/narrow widths, and observed versus reconstructed/simulated information is not visually or textually conflated.

A Story step must be derived from current observed data or from a clearly labeled general DNS role. Its selectable target and contextual alternatives are pure domain semantics; the presentation must not infer the next actor from layout position or turn those alternatives into a quiz by default. Missing delegation evidence must not be replaced with an invented authoritative zone.

An alias chain is supported only when it starts from the queried hostname and can be derived from observed CNAME owner → RDATA relationships. Terminal A/AAAA records are matched by their observed owner name. Multiple hops must remain finite; cycles and missing terminal addresses remain explicit outcomes rather than inferred success.

A Compare branch must be derived independently from each current `DnsExploration`. Shared ancestry is based on equal namespace stages from Root downward; downstream delegation evidence may be absent and must remain visibly absent rather than inferred.

A Cache / TTL Lab state transition must be produced by pure local simulation logic. The initial TTL seeds may come from the current exploration, but lookup kind, remaining TTL, cache fill, and expiry must not depend on React layout or additional network requests.

## 7. Evolution rules

- Keep current approved behavior here; keep decision history in Issues and PRs.
- Do not silently broaden an explanatory or simulated model into a measurement claim.
- Add learning capabilities incrementally around a concrete learning outcome rather than adding protocol data only because it is available.
- Prefer protocol-semantic interaction over generic pagination when the domain action can be represented accessibly and directly.
- Preserve DNS record ownership when transforming observed data into teaching projections.
- Add new protocols only when their observation boundary and learning purpose are explicit.
