# Architecture

## Current slice

Internet Anatomy is currently a browser-first React + TypeScript + Vite application. There is no application backend, database, authentication boundary, or persistent user state.

```text
Browser
  ├─ React UI / learning model
  └─ HTTPS fetch
        ↓
Google Public DNS JSON API (DNS-over-HTTPS)
        ↓
Observed DNS responses
        ↓
Pure DNS transformation
        ├─ namespace stages + records
        ├─ explanatory Resolution Story
        │    ├─ current holder / target actor
        │    └─ meaningful premature alternatives
        └─ two-exploration DNS comparison model
```

## DNS observation boundary

The browser queries `https://dns.google/resolve` using the documented Google Public DNS JSON API. Queries set `edns_client_subnet=0.0.0.0/0` so the app does not request client-subnet forwarding to authoritative servers. Google still receives the browser's HTTPS request and the queried hostname.

The application reconstructs an educational namespace model by querying NS records for `.` and every increasingly specific suffix of the hostname. A visible step with NS records is treated as an observed delegation/zone signal. SOA is queried for observed NS stages. A, AAAA, and CNAME are queried for the final hostname.

`src/lib/story.ts` projects one exploration result into a causal teaching sequence: client → Recursive Resolver → Root → TLD → observed lower delegations / authoritative zone → answer → client. Each step also declares an explanatory current holder, the next selectable actor, and a small set of plausible premature actors with causal explanations. These are pure teaching semantics derived from the current exploration/general DNS roles; React layout does not determine them.

`src/lib/compare.ts` projects two complete current `DnsExploration` values into a contrastive model. Shared ancestry is the equal namespace-stage prefix from Root downward. The first unequal stage is the divergence point. If only Root is shared, divergence is described at the TLD level; otherwise it is described as a downstream delegation/responsibility split. Each branch derives downstream delegation evidence only from that branch's post-divergence stages, so a shared TLD NS record is never relabeled as a name-specific authoritative zone.

If no downstream NS delegation is observed, Story must skip the authoritative-zone step and Compare must show the branch delegation as unobserved rather than inventing one. NODATA remains a valid final outcome in both projections.

This is deliberately **not** described as:

- a raw DNS packet capture;
- the user's operating-system stub/resolver path;
- a browser performing iterative UDP/TCP queries directly against Root/TLD/authoritative servers;
- proof of which authoritative server a cached recursive answer came from;
- measured per-hop DNS timing;
- a simultaneous network trace between the two compared names.

Story actor choices and handoff arrows are explanatory responsibility transitions. They are not evidence that the browser sent a packet to the selected actor. The resolver boundary and reconstruction disclosure must stay visible.

## Responsibility boundaries

- `src/lib/domain.ts`: input normalization and DNS namespace decomposition. No UI state or network I/O.
- `src/lib/dns.ts`: Google DoH boundary and transformation into the observed product DNS model.
- `src/lib/story.ts`: pure derivation of explanatory Story steps, direct-interaction targets, and premature-choice explanations from one `DnsExploration`; no network I/O or React state.
- `src/lib/compare.ts`: pure derivation of shared ancestry, divergence semantics, and two branches from two `DnsExploration` values; no network I/O or React state.
- `src/components/DnsStory.tsx`: fixed protocol-theater presentation. It renders actor semantics supplied by `story.ts`, uses native controls/fieldset semantics, and does not decide the correct next actor from position or styling.
- `src/components/DnsCompare.tsx`: Compare query controls and comparison presentation; it consumes comparison semantics rather than deriving them.
- `src/components/DnsPath.tsx` / `DnsInspector.tsx`: Explore path visualization and direct record/stage inspection.
- `src/App.tsx`: request lifecycle, cancellation, learning-mode state, Story interaction/feedback state, local Auto scheduling, Compare request coordination, Explore selection synchronization, and page composition.

Do not add a generic repository/service layer while there is only one real integration and a small number of direct learning projections.

## Story interaction model

- Story is a mostly viewport-fixed teaching stage. It deliberately omits raw-detail surfaces that belong in Explore so the current question, actors, and feedback can remain in one context.
- The pure Story step names the `source`, correct `target`, and meaningful `alternatives`. The UI presents these as visible native buttons; click, touch, and keyboard use the same state transition.
- Selecting the target produces immediate success feedback from the current step and advances the active responsibility question.
- Selecting a premature alternative leaves the step unchanged, stops Auto if necessary, and explains why that responsibility boundary is not yet reachable. This is guidance, not a scored wrong answer.
- Back is supporting navigation. It does not replace the actor-selection interaction.
- Auto uses a local timeout to choose the declared target. Its duration is presentation timing only and must not be labeled as DNS latency.
- Story feedback may remain visible while the next question becomes active so cause/result continuity is preserved without another Continue/Next action.
- Existing focus-visible treatment and semantic buttons/fieldset provide keyboard semantics. Specialist Story CSS is limited to the protocol-stage composition, actor nodes, baton/handoff geometry, and fixed viewport behavior.
- Reduced-motion styling removes nonessential actor transition effects; no synthetic packet animation is introduced.

## Compare model

- Compare issues two independent explorations through the same browser-to-Google-DoH boundary and waits for both before publishing a comparison.
- Starting a new comparison clears the previous comparison. If either side fails, no mixed old/new pair is presented as current.
- Comparison semantics are based on namespace identity and observed records, not elapsed time or resolver-hop telemetry.
- The default pair is `google.com` and `github.com`; it is product sample data, not hard-coded comparison logic.
- The current capability intentionally compares exactly two names. Supporting more names would require a new information architecture rather than simply adding more columns.

## Failure model

- Invalid user input fails before external I/O.
- A new single exploration aborts the previous single request and clears its result so stale data is never presented as current.
- A new comparison aborts the previous comparison request, clears the pair, and publishes a result only after both current explorations succeed.
- NXDOMAIN is reported explicitly when final record queries agree on `Status=3`.
- NODATA (`NOERROR` with no matching records) can still produce a valid namespace exploration, Story, and comparison branch with an empty final answer list.
- Other DNS response codes such as `SERVFAIL`, `REFUSED`, and `FORMERR` surface as explicit errors rather than being presented as NODATA.
- A DoH transport failure surfaces as a retryable error; previous results for the affected operation remain cleared.
- A premature Story actor selection is not a protocol/application failure and must not use the error presentation path.

## Future boundary

A server-side iterative resolver/probe may be added later if the product needs to observe actual Root → TLD → authoritative query execution. That is a new network/trust boundary and must not be introduced merely to make Story look more realistic.
