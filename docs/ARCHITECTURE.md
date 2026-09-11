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
        ├─ observed CNAME alias chain
        ├─ explanatory Resolution Story
        │    ├─ current holder / target actor
        │    ├─ contextual alternatives
        │    └─ optional alias → canonical → address detour
        ├─ two-exploration DNS comparison model
        ├─ local Cache / TTL simulation seed
        │    ↓
        │   Pure local cache lifecycle model
        └─ local Break DNS failure-model projection
```

## DNS observation boundary

The browser queries `https://dns.google/resolve` using the documented Google Public DNS JSON API. Queries set `edns_client_subnet=0.0.0.0/0` so the app does not request client-subnet forwarding to authoritative servers. Google still receives the browser's HTTPS request and the queried hostname.

The application reconstructs an educational namespace model by querying NS records for `.` and every increasingly specific suffix of the hostname. A visible step with NS records is treated as an observed delegation/zone signal. SOA is queried for observed NS stages. A, AAAA, and CNAME are queried for the final hostname. Answer record owner names are preserved because CNAME learning depends on distinguishing the alias owner from the canonical owner of terminal A/AAAA records.

`src/lib/alias.ts` projects only the current observed Answer records into a logical alias chain. It normalizes DNS names, starts at the queried hostname, follows observed CNAME owner → RDATA relationships, and matches terminal A/AAAA only when the record owner equals the final canonical name. Multiple observed hops are followed in order. A visited-name guard stops malformed cycles finitely. If the chain has no observed terminal A/AAAA, that remains an explicit `alias-without-address` outcome rather than being inferred.

`src/lib/story.ts` projects one exploration result into a causal teaching sequence: client → Recursive Resolver → Root → TLD → observed lower delegations / authoritative zone → optional CNAME alias handoff(s) → terminal answer → client. Each step declares an explanatory current holder and reachable target plus contextual alternatives. These are pure teaching semantics derived from the current exploration/general DNS roles; React layout does not determine them.

`src/lib/compare.ts` projects two complete current `DnsExploration` values into a contrastive model. Shared ancestry is the equal namespace-stage prefix from Root downward. The first unequal stage is the divergence point. If only Root is shared, divergence is described at the TLD level; otherwise it is described as a downstream delegation/responsibility split. Each branch derives downstream delegation evidence only from that branch's post-divergence stages, so a shared TLD NS record is never relabeled as a name-specific authoritative zone.

`src/lib/cacheLab.ts` derives a simulation seed from the current exploration and then operates entirely locally. It uses observed TTL values as initial durations, but modeled cache insertion time, remaining TTL, cache hit/miss classification, simulated time, and route reopening are pure deterministic state transitions. It performs no DNS requests and has no access to Google Public DNS cache internals.

If no downstream NS delegation is observed, Story must skip the authoritative-zone step and Compare must show the branch delegation as unobserved rather than inventing one. NODATA remains a valid final outcome in both projections. A CNAME chain without an observed terminal address or with a cycle also remains explicit rather than being converted into a successful address result.

This is deliberately **not** described as:

- a raw DNS packet capture;
- the user's operating-system stub/resolver path;
- a browser performing iterative UDP/TCP queries directly against Root/TLD/authoritative servers;
- proof of which authoritative server a cached recursive answer came from;
- proof that the browser performed a separate DNS query for every CNAME target;
- Google Public DNS cache contents, cache age, cache hit telemetry, eviction behavior, or the actual path taken by that resolver;
- measured per-hop DNS timing;
- a simultaneous network trace between the two compared names.

Story actor choices, handoff arrows, CNAME rails, and Lab route rails are explanatory or simulated relationships. They are not evidence that the browser or Google Public DNS sent a packet along the rendered route. The resolver boundary and simulation/reconstruction disclosures must stay visible.

## Responsibility boundaries

- `src/lib/domain.ts`: input normalization and DNS namespace decomposition. No UI state or network I/O.
- `src/lib/shareState.ts`: pure parsing/serialization of shareable entry state. Hostnames are validated through `normalizeHostname`; malformed URL state falls back to product defaults and never initiates a query with an unvalidated hostname.
- `src/lib/dns.ts`: Google DoH boundary and transformation into the observed product DNS model. Preserves Answer record owner/type/TTL/data.
- `src/lib/alias.ts`: pure derivation of observed CNAME owner → target chains, terminal owner-matched A/AAAA records, missing-terminal outcomes, and cycle protection. No network I/O or React state.
- `src/lib/story.ts`: pure derivation of explanatory Story steps, direct-interaction targets, contextual alternatives, and optional alias/canonical Story semantics from one `DnsExploration`; no network I/O or React state.
- `src/lib/compare.ts`: pure derivation of shared ancestry, divergence semantics, and two branches from two `DnsExploration` values; no network I/O or React state.
- `src/lib/cacheLab.ts`: pure derivation of Cache / TTL Lab seed and local lifecycle transitions; no network I/O or React state.
- `src/lib/failureLab.ts`: pure derivation of working/NODATA/NXDOMAIN/missing-delegation/CNAME-loop teaching states. It performs no network I/O and loops terminate finitely.
- `src/components/DnsLab.tsx` / `DnsFailureLab.tsx`: Lab experiment switch and Break DNS presentation; UI consumes pure model output rather than deriving failure semantics from layout.
- `src/components/DnsStory.tsx`: fixed protocol-theater presentation. It renders actor/alias semantics supplied by `story.ts`, uses native controls/fieldset semantics, and does not decide the next actor or record ownership from position/styling.
- `src/components/DnsCompare.tsx`: Compare query controls and comparison presentation; it consumes comparison semantics rather than deriving them.
- `src/components/DnsCacheLab.tsx`: Cache / TTL simulation controls and route/cache-state presentation; it consumes `cacheLab.ts` transitions rather than inferring cache behavior from layout.
- `src/components/DnsPath.tsx` / `DnsInspector.tsx`: Explore path visualization and direct record/stage inspection.
- `src/App.tsx`: request lifecycle, cancellation, learning-mode state, Story interaction/feedback state, local Auto scheduling, optional CNAME sample entry action, Compare request coordination, Lab composition, Explore selection synchronization, share-URL synchronization via `history.replaceState`, and page composition.

Do not add a generic repository/service layer while there is only one real integration and a small number of direct learning projections.

## Story interaction model

- Story is a mostly viewport-fixed teaching stage. It deliberately omits raw-detail surfaces that belong in Explore so the current question, actors, and feedback can remain in one context.
- The pure Story step names the `source`, reachable `target`, and meaningful contextual `alternatives`. The default UI presents the target as the direct-manipulation control; alternatives stay available to the domain model but are not rendered as a multiple-choice correctness loop. Click, touch, and keyboard use the same state transition.
- Activating the target produces immediate feedback from the current step and advances the active responsibility question.
- When an alias chain exists, Story inserts explicit name-to-name actors before the terminal address step. Alias/CNAME/canonical/address ownership comes from the pure alias/story model, not the React layout.
- The CNAME rail is a compact explanatory projection of already observed Answer records. It must not trigger hidden network requests or imply packet chronology.
- Back is supporting navigation. It does not replace the actor-selection interaction.
- Auto uses a local timeout to choose the declared target. Its duration is presentation timing only and must not be labeled as DNS latency.
- Story feedback may remain visible while the next question becomes active so cause/result continuity is preserved without another Continue/Next action.
- Existing focus-visible treatment and semantic buttons/fieldset provide keyboard semantics. Specialist Story CSS is limited to the protocol-stage composition, actor nodes, baton/handoff geometry, alias rail, fixed viewport behavior, and semantic state-transition motion.
- Story motion is presentation-only and does not alter domain timing: short transform/opacity/rail reveals orient the learner after a state change and never delay the state transition or imply packet latency.
- Reduced-motion styling removes those spatial transitions while preserving identical actor, feedback, and Story state; no synthetic packet animation is introduced.

## Compare model

- Compare issues two independent explorations through the same browser-to-Google-DoH boundary and waits for both before publishing a comparison.
- Starting a new comparison clears the previous comparison. If either side fails, no mixed old/new pair is presented as current.
- Comparison semantics are based on namespace identity and observed records, not elapsed time or resolver-hop telemetry.
- The default pair is `google.com` and `github.com`; it is product sample data, not hard-coded comparison logic.
- The current capability intentionally compares exactly two names. Supporting more names would require a new information architecture rather than simply adding more columns.

## Cache / TTL Lab model

- Entering Lab does not make a new network request unless the learner submits a different hostname through the existing query flow.
- `deriveCacheLabSeed` selects a representative answer TTL from observed A/AAAA records when available and a representative delegation TTL from observed NS records. These are model inputs only.
- The initial local state has no modeled cache entries. `runCacheLookup` therefore classifies the first lookup as `full-resolution` and fills both modeled answer/delegation entries at simulated time 0.
- While the answer entry remains valid, the next modeled lookup is `answer-cache-hit`: the route collapses to Client → Resolver → Answer Cache → Return.
- When the answer entry expires while delegation remains valid, the next modeled lookup is `delegation-cache-hit`: Root/TLD remain unnecessary in the simulation and only downstream authoritative answer work reopens. Running that lookup refreshes only the answer cache timestamp.
- When delegation also expires, the next modeled lookup returns to `full-resolution` and both modeled layers refresh.
- Expiry controls advance the local simulation clock just past the relevant expiry boundary. They do not wait in real time and do not mutate external resolver state.
- Reduced-motion removes route reveal transitions but preserves the same route nodes, cache text, remaining TTL values, and controls.

## Break DNS Lab model

- Break DNS runs entirely in the browser against a local teaching model; it does not mutate DNS or issue scenario-specific network requests.
- `working` reaches a terminal modeled answer. `nodata` keeps the name present but removes terminal A/AAAA. `nxdomain` models the queried name itself as absent. `missing-delegation` stops before an authoritative boundary can be reached. `cname-loop` returns to a previously visited alias and then terminates with an explicit STOP node.
- These states are semantic teaching projections, not claims about the currently observed public domain.

## Failure model

- Invalid user input fails before external I/O.
- A new single exploration aborts the previous single request and clears its result so stale data is never presented as current.
- A new comparison aborts the previous comparison request, clears the pair, and publishes a result only after both current explorations succeed.
- NXDOMAIN is reported explicitly when final record queries agree on `Status=3`.
- NODATA (`NOERROR` with no matching records) can still produce a valid namespace exploration, Story, and comparison branch with an empty final answer list.
- An observed CNAME without a terminal owner-matched A/AAAA is an explicit alias-without-address Story outcome; no address is invented.
- A malformed observed CNAME cycle stops finitely and is shown as a cycle outcome.
- Other DNS response codes such as `SERVFAIL`, `REFUSED`, and `FORMERR` surface as explicit errors rather than being presented as NODATA.
- A DoH transport failure surfaces as a retryable error; previous results for the affected operation remain cleared.

## Future boundary

A server-side iterative resolver/probe may be added later if the product needs to observe actual Root → TLD → authoritative query execution, real recursive cache behavior, or the DNS query sequence used while chasing aliases. That is a new network/trust boundary and must not be introduced merely to make Story or Lab look more realistic.
