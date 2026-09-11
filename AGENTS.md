# Internet Anatomy — Agent Instructions

Foundation-Version: 0.8.1

## Scope

Follow Web App Foundation v0.8.1 as the engineering baseline. `PRODUCT.md` is authoritative for product behavior, `DESIGN.md` for UI/UX, and `docs/ARCHITECTURE.md` for the DNS integration and responsibility boundary. App-specific rules may be stricter than Foundation but must not silently contradict it.

## Read order

Before a material change:

1. Read the Issue / approved request and acceptance criteria.
2. Read `PRODUCT.md`.
3. Read this `AGENTS.md`.
4. Apply Context routing and load the union of matching contracts.
5. Read `README.md` when public usage or contributor setup changes.

For material Chat-based implementation, follow the operating method in Foundation `docs/ai-implementation.md` at the version recorded in `docs/FOUNDATION.md`: build a session-local context packet, extract Design Intent, map acceptance criteria to implementation/validation surfaces, then implement.

## Context routing

| Change area / condition | Required context in addition to the base route |
| --- | --- |
| Product design / UX | `DESIGN.md`, Foundation `docs/ui-review.md` |
| UI infrastructure | `DESIGN.md`, Foundation `docs/ui-implementation.md`, Foundation `docs/ui-review.md` |
| DNS domain / data transformation | `docs/ARCHITECTURE.md` |
| Integration / trust | `docs/ARCHITECTURE.md` |
| Architecture / platform | `docs/ARCHITECTURE.md` |
| Delivery / operations | affected `.github/workflows/*`, `docs/FOUNDATION.md` |
| Foundation adoption / upgrade | `docs/FOUNDATION.md`, target Foundation adoption/change guidance |

Matching routes are additive. Do not create empty specialist documents solely to fill the table.

## Implementation rules

- Use a short-lived Issue branch from the exact observed `main` SHA. Do not write feature work directly to `main`.
- Prefer the smallest coherent implementation. Do not add backend services, state-management libraries, persistence, generic service/repository layers, or visualization frameworks before a current requirement needs them.
- Keep pure DNS/domain transformation independent from React state.
- Treat external DNS resolution as an explicit trust boundary. Do not hide or broaden what is transmitted externally.
- Never describe reconstructed DNS namespace/delegation as packet-level observation.
- Preserve keyboard semantics, visible focus, reduced-motion behavior, and no-color-only meaning.
- Material UI work requires render → critique → fix → re-render at roughly 1440px, 390px, and 320px.
- `check`, `typecheck`, `test`, and `build` are required. Run E2E for material user-facing flows.

## Mandatory completion loop

For every material change: implement → self-review the entire final diff against Issue/Design Intent → correct real defects within approved scope → re-review → run final validation after the last material correction → report evidence and remaining risk.

Independent review is risk-based. Codex review must never be invoked automatically; present the concrete risk/reason and obtain explicit user approval before every invocation.
