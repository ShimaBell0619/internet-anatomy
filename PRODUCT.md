# Product Contract

Status: active.

## 1. Purpose

Internet Anatomy makes invisible Internet infrastructure understandable through interactive exploration of real protocol data. The current DNS surface helps a user understand not only what records exist, but why responsibility moves from a recursive resolver through Root, TLD, delegated/authoritative DNS, and back to the client.

## 2. Users and primary jobs

- Learners and engineers who want to understand DNS by observing real domains instead of reading only static diagrams.
- Primary job: enter a familiar hostname and use **Story** to follow the causal resolution chain—what is being asked, what each DNS layer knows, and why the next step follows.
- Secondary job: use **Explore** to inspect the observed namespace stages, NS/SOA data, and final answer records in detail.

## 3. Core behaviors

- Accept a URL or hostname and normalize it to a DNS hostname.
- Query real public DNS data and distinguish observed data from explanatory reconstruction.
- Default to a guided DNS Resolution Story derived from the current exploration result.
- Explain the roles of the client, Recursive Resolver, Root, TLD, observed delegation/authoritative zone, final answer, and return to the client.
- For each Story step, explain the current question, what was learned, and why the next step follows.
- Support manual Previous / Next navigation and Play / Pause for the Story while visibly focusing the corresponding DNS stage or answer.
- Keep Explore available for direct inspection of the DNS namespace from `.` through successively more specific names and observed delegation points.
- Show A, AAAA, CNAME, NS, and SOA data when available, including TTL.
- Explain selected stages and records in Japanese without requiring prior DNS terminology.
- Clear stale results when a new exploration starts or fails.
- Keep loading, NODATA, NXDOMAIN, invalid-input, DNS-protocol-error, and transport-error states explicit.

## 4. Product constraints

- No authentication or persistence is required for the current learning experience.
- DNS queries are sent directly from the user's browser to the documented public DNS-over-HTTPS resolver. The UI must disclose that boundary.
- Story is an explanatory playback reconstructed from observed DNS data. The app must not claim that it is a packet capture, the user's OS resolver path, or an iterative query performed by the browser.
- Story and Explore must remain keyboard reachable and usable at approximately 1440px, 390px, and 320px widths without horizontal overflow.
- Meaningful Story state must remain understandable without color alone; motion must respect reduced-motion behavior.

## 5. Non-goals

- Editing or managing DNS zones.
- Capturing raw DNS/UDP packets or observing a real iterative resolver exchange.
- Simulating resolver cache/TTL expiry; TTL may be explained but not presented as a live cache model yet.
- User accounts, saved projects, or browsing history.
- TCP, TLS, HTTP, CDN, cloud topology, or multi-region probing in the current DNS slice.

## 6. Acceptance boundaries

A DNS capability is supported only when its semantics are documented, representative success and failure transformations are tested, the rendered flow is validated at desktop/mobile/narrow widths, and observed versus reconstructed information is not visually or textually conflated.

A Story step must be derived from current observed data or from a clearly labeled general DNS role. Missing delegation evidence must not be replaced with an invented authoritative zone.

## 7. Evolution rules

- Keep current approved behavior here; keep decision history in Issues and PRs.
- Do not silently broaden an explanatory model into a measurement claim.
- Add learning capabilities incrementally around a concrete learning outcome rather than adding protocol data only because it is available.
- Add new protocols only when their observation boundary and learning purpose are explicit.
