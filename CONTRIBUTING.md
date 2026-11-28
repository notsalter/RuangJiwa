# Contributing to RuangJiwa

Report bugs with the tested revision, browser and viewport, reproduction steps, and expected and actual behaviour. Check existing issues first. Never attach journal content, moods, credentials, cookies or secret-bearing logs; test data must be your own and clearly fictional.

## Development

Read [Setup and deployment](docs/SETUP.md) for the Node requirement and the exact commands, and [Migration record](docs/MIGRATION.md) for what is verified and what is still open. Work in a focused branch. Install with the lockfile, and keep any `.env` local: it is git-ignored and must never be committed.

A change to the web app is expected to keep the whole gate green, not only the suite you touched:

```sh
cd web
npm run check                  # typecheck, unit/component tests, dependency tests, build
node --test tests/pwa.test.mjs # worker, manifest and install policy
```

A change to the API runs `npm test` and `npm run build` in `server/`.

## For each behaviour change

1. Add a regression test and watch it fail for the right reason before implementing.
2. Keep the boundary honest: mock the network or the backend only; session state, validation, selectors and components must stay real.
3. Do not invent data. No fabricated psychologists, testimonials, statistics or seed accounts, and no mock production records.
4. Preserve the Indonesian content language, the indigo identity and the five-tab navigation unless the change is explicitly about them.
5. Keep the privacy posture: no third-party analytics, no telemetry, no token in browser storage, and private records never cached by the service worker.

## Before a pull request

Run the gate above and `npm audit --audit-level=moderate` for the component you changed. Exercise the real user journey where the change affects it, and record exact results plus anything you could not test. Deterministic fixture tests do not establish production Firebase behaviour, deployed rules or real-device installation.

Review and stage only intended files, retain the lockfiles, and keep private evidence outside the repository. Use focused commits; no history rewriting. Read back the remote checks on the exact PR head before release. Be specific and respectful in review.
