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
        └─ explanatory Resolution Story
```

## DNS observation boundary

The browser queries `https://dns.google/resolve` using the documented Google Public DNS JSON API. Queries set `edns_client_subnet=0.0.0.0/0` so the app does not request client-subnet forwarding to authoritative servers. Google still receives the browser's HTTPS request and the queried hostname.

The application reconstructs an educational namespace model by querying NS records for `.` and every increasingly specific suffix of the hostname. A visible step with NS records is treated as an observed delegation/zone signal. SOA is queried for observed NS stages. A, AAAA, and CNAME are queried for the final hostname.

`src/lib/story.ts` projects that exploration result into a causal teaching sequence: client → Recursive Resolver → Root → TLD → observed lower delegations / authoritative zone → answer → client. The sequence describes normal DNS responsibility using observed records as evidence; it does not observe those network exchanges directly.

If no downstream NS delegation is observed, Story must skip the authoritative-zone step rather than inventing one. NODATA remains a valid final Story outcome.

This is deliberately **not** described as:

- a raw DNS packet capture;
- the user's operating-system stub/resolver path;
- a browser performing iterative UDP/TCP queries directly against Root/TLD/authoritative servers;
- proof of which authoritative server a cached recursive answer came from;
- measured per-hop DNS timing.

The resolver boundary and explanatory reconstruction must stay visible in product copy and Story playback.

## Responsibility boundaries

- `src/lib/domain.ts`: input normalization and DNS namespace decomposition. No UI state or network I/O.
- `src/lib/dns.ts`: Google DoH boundary and transformation into the observed product DNS model.
- `src/lib/story.ts`: pure derivation of explanatory Story steps from a `DnsExploration`; no network I/O or React state.
- `src/components/DnsStory.tsx`: Story presentation and controls.
- `src/components/DnsPath.tsx` / `DnsInspector.tsx`: shared path visualization and direct Explore inspection.
- `src/App.tsx`: request lifecycle, cancellation, Story/Explore mode state, playback scheduling, selection synchronization, and page composition.

Do not add a generic repository/service layer while there is only one real integration and a small number of direct learning projections.

## Playback model

- Story playback advances discrete explanatory steps using local UI time only.
- Playback duration is not DNS latency and must not be labeled as network timing.
- Story focus is mapped back to an observed namespace stage or answer record so the visualization and explanation remain synchronized.
- Direct canvas inspection exits the Story narrative into Explore rather than allowing an arbitrary selection to contradict the active Story step.
- Existing reduced-motion CSS collapses focus transitions; no synthetic packet animation is introduced.

## Failure model

- Invalid user input fails before external I/O.
- A new exploration aborts the previous request and clears its result so stale data is never presented as current.
- NXDOMAIN is reported explicitly when final record queries agree on `Status=3`.
- NODATA (`NOERROR` with no matching records) can still produce a valid namespace exploration and Story with an empty final answer list.
- Other DNS response codes such as `SERVFAIL`, `REFUSED`, and `FORMERR` surface as explicit errors rather than being presented as NODATA.
- A DoH transport failure surfaces as a retryable error; the previous successful result remains cleared.

## Future boundary

A server-side iterative resolver/probe may be added later if the product needs to observe actual Root → TLD → authoritative query execution. That is a new network/trust boundary and must not be introduced merely to make the Story look more realistic.
