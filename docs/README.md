# Documentation

Start with the [project README](../README.md) for what the app does and how to run it. Everything else lives here.

| Document | Answers |
| --- | --- |
| [Setup and deployment](SETUP.md) | Node version, commands, environment variables, self-hosted API, hosting options and host requirements |
| [PWA](PWA.md) | Shell integration, deployment bases, service worker cache and update policy, install behaviour |
| [Design](DESIGN.md) | Visual and interaction decisions, palette, motion and accessibility intent |
| [Avatars](AVATARS.md) | Avatar delivery, what is verified, and the accepted download-token risk |
| [Firebase rules](FIREBASE_RULES.md) | Proposed owner-scoped rules, schema evidence, and the local emulator suite |
| [Testing](TESTING.md) | The implementation gate this release had to pass, with measured results |
| [Test evidence](TEST_EVIDENCE.md) | How each behaviour was driven red, then green |
| [Migration record](MIGRATION.md) | Delivered milestones, current verification numbers, decisions and open items |

Component-level notes live next to the code: [web/README.md](../web/README.md) and [server/README.md](../server/README.md).

## Reading order for a change

1. [SETUP.md](SETUP.md) for the exact commands CI runs.
2. [PWA.md](PWA.md) before touching the worker, the manifest, base paths or navigation.
3. [FIREBASE_RULES.md](FIREBASE_RULES.md) before touching collections, ownership fields or rules.
4. [AVATARS.md](AVATARS.md) before touching profile images or authenticated blob reads.
5. [MIGRATION.md](MIGRATION.md) for what is verified and what is still open.

## Limits of these documents

They describe intended behaviour and the checks that were actually run. They are not a compliance certification, a benchmark, or a claim that any deployment exists. Nothing in this repository is deployed, and the operational items in [MIGRATION.md](MIGRATION.md) are still open.
