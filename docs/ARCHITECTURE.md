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
Pure transformation into namespace stages + records
```

## DNS observation boundary

The browser queries `https://dns.google/resolve` using the documented Google Public DNS JSON API. Queries set `edns_client_subnet=0.0.0.0/0` so the app does not request client-subnet forwarding to authoritative servers. Google still receives the browser's HTTPS request and the queried hostname.

The application then reconstructs an educational namespace model by querying NS records for `.` and every increasingly specific suffix of the hostname. A visible step with NS records is treated as an observed delegation/zone signal. SOA is queried for observed NS stages. A, AAAA, and CNAME are queried for the final hostname.

This is deliberately **not** described as:

- a raw DNS packet capture;
- the user's operating-system stub/resolver path;
- a browser performing iterative UDP queries directly against Root/TLD/authoritative servers;
- proof of which authoritative server a cached recursive answer came from.

The resolver boundary and explanatory reconstruction must stay visible in product copy.

## Responsibility boundaries

- `src/lib/domain.ts`: input normalization and DNS namespace decomposition. No UI state or network I/O.
- `src/lib/dns.ts`: Google DoH boundary and transformation into the product DNS model.
- `src/components/*`: product-specific presentation and selection behavior.
- `src/App.tsx`: request lifecycle, cancellation, stale-state clearing, and page composition.

Do not add a generic repository/service layer while there is only one real integration and one use case.

## Failure model

- Invalid user input fails before external I/O.
- A new exploration aborts the previous request and clears its result so stale data is never presented as current.
- NXDOMAIN is reported explicitly when final record queries agree on `Status=3`.
- NODATA (`NOERROR` with no matching records) can still produce a valid namespace exploration with an empty final answer list.
- Other DNS response codes such as `SERVFAIL`, `REFUSED`, and `FORMERR` surface as explicit errors rather than being presented as NODATA.
- A DoH transport failure surfaces as a retryable error; the previous successful result remains cleared.

## Future boundary

A server-side iterative resolver/probe may be added later if the product needs to observe actual Root → TLD → authoritative query execution. That is a new network/trust boundary and must not be introduced merely to make the diagram look more realistic.
