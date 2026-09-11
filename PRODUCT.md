# Product Contract

Status: active.

## 1. Purpose

Internet Anatomy makes invisible Internet infrastructure understandable through interactive exploration of real protocol data. The current DNS surface helps a user understand not only what records exist, but why responsibility moves from a recursive resolver through Root, TLD, delegated/authoritative DNS, and back to the client—and how that responsibility differs between two names.

## 2. Users and primary jobs

- Learners and engineers who want to understand DNS by observing real domains instead of reading only static diagrams.
- Primary job: enter a familiar hostname and use **Story** to manipulate a guided DNS responsibility model—see the current holder, choose the next reachable actor, and receive immediate explanation of what happened and why.
- Contrastive job: use **Compare** with exactly two hostnames to see which DNS layers are shared and the first point where responsibility diverges.
- Detail job: use **Explore** to inspect the observed namespace stages, NS/SOA data, and final answer records directly.

## 3. Core behaviors

- Accept a URL or hostname and normalize it to a DNS hostname.
- Query real public DNS data and distinguish observed data from explanatory reconstruction.
- Default to a guided DNS Resolution Story derived from the current exploration result.
- Present Story as a mostly viewport-fixed protocol theater: the current question, current holder, reachable DNS actors, and immediate feedback stay in one visual context instead of requiring normal page scrolling.
- Advance Story primarily by selecting the meaningful next DNS actor/action. Generic pagination is not the primary progression mechanism.
- Explain premature/early selections non-punitively: tell the learner why that actor is not reachable yet instead of scoring the choice as a failure.
- After a correct selection, reveal concise **WHAT JUST HAPPENED** and **WHY NEXT** feedback while moving the active question to the next responsibility handoff.
- Provide Back as supporting navigation and Auto as a secondary watch mode. Auto uses local UI timing only and must not imply measured DNS latency.
- Keep Story intentionally selective; detailed NS/SOA/record inspection belongs to Explore.
- Explain the roles of the client, Recursive Resolver, Root, TLD, observed delegation/authoritative zone, final answer, and return to the client.
- Provide Compare for exactly two hostnames, starting from a useful `google.com` / `github.com` pair.
- In Compare, identify the shared DNS namespace prefix, the first divergence point, each name-specific branch, observed downstream delegation evidence, and final answers.
- When TLDs differ, make clear that responsibility diverges at the TLD level rather than implying shared TLD authority.
- Keep Explore available for direct inspection of the DNS namespace from `.` through successively more specific names and observed delegation points.
- Show A, AAAA, CNAME, NS, and SOA data when available, including TTL.
- Explain selected stages and records in Japanese without requiring prior DNS terminology.
- Clear stale results when a new exploration or comparison starts or fails.
- Keep loading, NODATA, NXDOMAIN, invalid-input, DNS-protocol-error, and transport-error states explicit.

## 4. Product constraints

- No authentication or persistence is required for the current learning experience.
- DNS queries are sent directly from the user's browser to the documented public DNS-over-HTTPS resolver. The UI must disclose that boundary.
- Story and Compare are explanatory projections reconstructed from observed DNS data. The app must not claim that either is a packet capture, the user's OS resolver path, or an iterative query performed by the browser.
- Story handoff lines, actor transitions, and Auto progression represent explanatory responsibility changes, not observed packets or measured hop timing.
- Story's core interaction must remain fully operable by click/tap and keyboard. Drag-and-drop may not be required for progression.
- A failed comparison must never present one new result beside one stale result as if both belong to the same comparison.
- Story should fit its normal scene within approximately one viewport at the rendered-review desktop/mobile baselines; Compare and Explore may scroll when their information density requires it.
- Story, Compare, and Explore must remain keyboard reachable and usable at approximately 1440px, 390px, and 320px widths without horizontal overflow.
- Meaningful state must remain understandable without color alone; motion must respect reduced-motion behavior.

## 5. Non-goals

- Editing or managing DNS zones.
- Capturing raw DNS/UDP packets or observing a real iterative resolver exchange.
- Simulating resolver cache/TTL expiry; TTL may be explained but not presented as a live cache model yet.
- Comparing more than two domains in the current Compare capability.
- Performance/latency benchmarking or multi-region probing.
- User accounts, saved projects, scores, streaks, lives, or other gamification systems.
- Making drag-and-drop the required interaction method.
- TCP, TLS, HTTP, CDN, or cloud topology in the current DNS slice.

## 6. Acceptance boundaries

A DNS capability is supported only when its semantics are documented, representative success and failure transformations are tested, the rendered flow is validated at desktop/mobile/narrow widths, and observed versus reconstructed information is not visually or textually conflated.

A Story step must be derived from current observed data or from a clearly labeled general DNS role. Its selectable target and premature alternatives are pure domain semantics; the presentation must not infer the next actor from layout position. Missing delegation evidence must not be replaced with an invented authoritative zone.

A Compare branch must be derived independently from each current `DnsExploration`. Shared ancestry is based on equal namespace stages from Root downward; downstream delegation evidence may be absent and must remain visibly absent rather than inferred.

## 7. Evolution rules

- Keep current approved behavior here; keep decision history in Issues and PRs.
- Do not silently broaden an explanatory model into a measurement claim.
- Add learning capabilities incrementally around a concrete learning outcome rather than adding protocol data only because it is available.
- Prefer protocol-semantic interaction over generic pagination when the domain action can be represented accessibly and directly.
- Add new protocols only when their observation boundary and learning purpose are explicit.
