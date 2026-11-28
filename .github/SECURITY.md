# Security policy

## Reporting a vulnerability

Report privately through GitHub's [Report a vulnerability](https://github.com/notsalter/RuangJiwa/security/advisories/new) form, or by opening a minimal issue that asks for a private channel without describing the flaw. Do not include journal content, credentials, session cookies, or request logs that carry tokens.

Include the affected revision, the component (`web/` or `server/`), reproduction steps, and the impact you believe it has. This is a personal project without a support contract, so expect a best-effort response rather than a deadline.

## What is in scope

- The web client in `web/`, including record validation, the backend adapter, the service worker cache allowlist and base-aware routing.
- The optional self-hosted API in `server/`, including session handling, owner scoping, avatar delivery and rate-limit identity.
- The proposed Firebase rules in `web/firebase/`. They are not deployed, so a rules finding affects a future deployment rather than a live one.

Out of scope: vulnerabilities in Firebase, Better Auth, Hono, Drizzle or other dependencies that are already public upstream, and reports that require an already-compromised browser or a leaked download token, which is a documented accepted risk rather than a new finding.

## Unresolved historical exposure

Two records are open and should not be treated as resolved by any code change:

- A secret scanning alert for a historical Google API key. Deleting the literal from code, or rewriting history, does not revoke the key; it has to be revoked or restricted in Google Cloud by the owner.
- A GitGuardian incident covering a deterministic credential in an old local test fixture. Current tests generate per-run random credentials. The incident still needs owner classification, and no suppression was applied.

Until that exposure is assessed, do not add new credentials to a machine that previously held this repository, and prefer a fresh checkout over an older one. [docs/MIGRATION.md](../docs/MIGRATION.md) tracks both items along with the other open operational gates.
