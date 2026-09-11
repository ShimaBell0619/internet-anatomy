# Foundation provenance

- Adopted Foundation version: 0.8.1
- Copied-rule/template commit: `9061ea222e5e6bba1197b03088c6cb2c13f7e0c4`
- Reusable workflow commit: `9061ea222e5e6bba1197b03088c6cb2c13f7e0c4`
- Adopted on: 2026-09-11
- App-specific deviations:
  - No complex UI primitive dependency is installed yet; the initial interaction uses semantic native input/button behavior plus product-specific visualization CSS. Add an accessible primitive library only when an interaction requires it.
  - The first DNS integration is browser-to-Google Public DNS DoH; no application backend exists in the initial slice.

Normative Foundation references for this adoption:

- `AGENTS.md`
- `docs/adoption.md`
- `docs/ai-implementation.md`
- `docs/ui-implementation.md`
- `docs/ui-review.md`

All references are interpreted at the copied-rule/template commit above unless a later Foundation upgrade updates this provenance deliberately.
