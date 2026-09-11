# Product Contract

Status: active.

## 1. Purpose

Internet Anatomy makes invisible Internet infrastructure understandable through interactive exploration of real protocol data. The first supported surface is DNS: a user provides a URL or hostname and learns how the DNS namespace, delegation, authoritative zones, and returned records relate to one another.

## 2. Users and primary jobs

- Learners and engineers who want to understand DNS by observing real domains instead of reading only static diagrams.
- Primary job: enter a familiar hostname, follow the hierarchy from root toward the answer, select any stage or record, and understand what role it plays.

## 3. Core behaviors

- Accept a URL or hostname and normalize it to a DNS hostname.
- Query real public DNS data and distinguish observed data from explanatory reconstruction.
- Visualize the DNS namespace from `.` through successively more specific names and show observed delegation points.
- Show A, AAAA, CNAME, NS, and SOA data when available, including TTL.
- Explain selected stages and records in Japanese without requiring prior DNS terminology.
- Clear stale results when a new exploration starts or fails.
- Keep loading, NODATA, NXDOMAIN, invalid-input, DNS-protocol-error, and transport-error states explicit.

## 4. Product constraints

- No authentication or persistence is required for the initial learning experience.
- DNS queries are sent directly from the user's browser to the documented public DNS-over-HTTPS resolver. The UI must disclose that boundary.
- The app must not claim that reconstructed namespace/delegation steps are a packet capture, the user's OS resolver path, or an iterative query performed by the browser.
- The primary flow must remain usable with keyboard input and at approximately 1440px, 390px, and 320px widths without horizontal overflow.

## 5. Non-goals

- Editing or managing DNS zones.
- Capturing raw DNS/UDP packets.
- User accounts, saved projects, or browsing history.
- TCP, TLS, HTTP, CDN, cloud topology, or multi-region probing in the first slice.

## 6. Acceptance boundaries

A DNS capability is supported only when its semantics are documented, representative success and failure transformations are tested, the rendered flow is validated at desktop/mobile/narrow widths, and observed versus reconstructed information is not visually or textually conflated.

## 7. Evolution rules

- Keep current approved behavior here; keep decision history in Issues and PRs.
- Do not silently broaden an explanatory model into a measurement claim.
- Add protocols incrementally only when their observation boundary and learning purpose are explicit.
