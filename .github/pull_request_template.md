## What changed

<!-- One or two sentences. Name the files or flows a reviewer should read first. -->

## Why

<!-- The user-visible or operational reason. Link the issue if there is one. -->

## Verification

- [ ] `npm run check` in `web/` (typecheck, tests, dependency tests, build)
- [ ] `npm run test:coverage` where behaviour changed
- [ ] `node --test tests/pwa.test.mjs` for worker, manifest, base or navigation changes
- [ ] `npm test` and `npm run build` in `server/` for API changes
- [ ] `npm audit --audit-level=moderate` for the touched component
- [ ] The real user journey, where the change affects it

Exact results:

<!-- Paste counts and outcomes, and state plainly what you did not test. -->

## Data and privacy

- [ ] No fabricated data: no invented psychologists, testimonials, statistics or seed accounts
- [ ] No secret, token or real `.env` value committed
- [ ] Private records stay out of the service worker cache
- [ ] Owner scoping and validation still hold on both backends
