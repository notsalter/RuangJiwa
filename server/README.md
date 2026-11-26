# RuangJiwa self-hosted API

Hono + Better Auth + Drizzle ORM over a local SQLite/libsql database. Node.js 22 or newer is required.

## Environment

Copy the values into the service environment; do not commit `.env` or secrets.

| Variable | Required | Description |
|---|---:|---|
| `BETTER_AUTH_SECRET` | yes | Random secret, at least 32 characters. Generate with `openssl rand -base64 32`. |
| `DB_URL` | no | Local SQLite URL, default `file:./data/ruangjiwa.db`. `libsql://` is accepted only when paired with `DB_AUTH_TOKEN`. |
| `DB_AUTH_TOKEN` | no | libsql token, if using a remote libsql-compatible endpoint. |
| `DATA_DIR` | no | Avatar directory, default `./data/avatars`. Keep it outside the public web root. |
| `WEB_ORIGIN` | recommended | Exact browser origin, for example `https://app.example.test`; enables credentialed CORS. Never use `*`. |
| `TRUSTED_ORIGINS` | recommended | Comma-separated Better Auth origins; defaults to `WEB_ORIGIN` or `http://localhost:5173`. |
| `AUTH_URL` | no | Public API origin used by Better Auth, default `http://localhost:3000`. |
| `PORT` | no | HTTP port, default `3000`. |
| `NODE_ENV` | no | Set `production` to enable the Secure session-cookie attribute. |

## Install, migrate, run

```sh
cd server
npm ci
export BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
export DB_URL='file:./data/ruangjiwa.db'
npm run migrate
npm run dev                 # development, tsx watch
npm run build && npm start  # production
npm test
```

`npm run migrate` is idempotent and creates the Better Auth tables (`user`, `session`, `account`, `verification`) and application tables. The SQL is documented in `src/db/migrate.ts`; the Drizzle definitions are in `src/db/schema.ts`. The default database is SQLite; no PostgreSQL setup is needed.

## HTTP notes

- Better Auth email/password endpoints are mounted below `/api/auth/*`.
- Private application routes use the Better Auth `httpOnly`, `SameSite=Lax` cookie. The server performs the ownership check; IDs supplied by clients are never trusted.
- API timestamps are ISO-8601 UTC strings. Unknown JSON fields are rejected with HTTP `422` and `error: "validation_error"`.
- Avatar upload accepts only JPEG, PNG, and WebP whose magic bytes agree with the declared MIME type, up to 5 MiB. Files are random-named as `${userId}-${random}.${ext}` under `DATA_DIR`, are not listed publicly, and are served only to the owning session.
- Common stable errors include `unauthorized`, `not_found`, `validation_error`, `invalid_transition`, `psychologist_not_found`, `invalid_avatar`, `avatar_too_large`, and `internal_error`.

## systemd example

Create `/etc/systemd/system/ruangjiwa-api.service` (adjust paths and user):

```ini
[Unit]
Description=RuangJiwa API
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=ruangjiwa
Group=ruangjiwa
WorkingDirectory=/opt/ruangjiwa/server
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=DB_URL=file:/var/lib/ruangjiwa/ruangjiwa.db
Environment=DATA_DIR=/var/lib/ruangjiwa/avatars
Environment=WEB_ORIGIN=https://app.example.test
Environment=TRUSTED_ORIGINS=https://app.example.test
Environment=AUTH_URL=https://api.example.test
EnvironmentFile=/etc/ruangjiwa/api.env
ExecStart=/usr/bin/node /opt/ruangjiwa/server/dist/index.js
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/var/lib/ruangjiwa

[Install]
WantedBy=multi-user.target
```

Put only `BETTER_AUTH_SECRET` (and, if needed, `DB_AUTH_TOKEN`) in root-readable `/etc/ruangjiwa/api.env`:

```sh
sudo chmod 600 /etc/ruangjiwa/api.env
sudo systemctl daemon-reload
sudo systemctl enable --now ruangjiwa-api
sudo systemctl status ruangjiwa-api
```

## SQLite backup and restore

Back up the database while the service is stopped, or use SQLite's online backup tooling. Include avatars because database rows refer to files on disk:

```sh
sudo systemctl stop ruangjiwa-api
install -d -m 700 /backups/ruangjiwa
sqlite3 /var/lib/ruangjiwa/ruangjiwa.db ".backup '/backups/ruangjiwa/ruangjiwa-$(date +%Y%m%d-%H%M%S).db'"
tar -C /var/lib/ruangjiwa -czf /backups/ruangjiwa/avatars-$(date +%Y%m%d-%H%M%S).tar.gz avatars
sudo systemctl start ruangjiwa-api
```

To restore, stop the service, replace the database and avatar directory from matching backup timestamps, verify ownership, then run the migration command and start the service:

```sh
sudo systemctl stop ruangjiwa-api
cp /backups/ruangjiwa/ruangjiwa-YYYYMMDD-HHMMSS.db /var/lib/ruangjiwa/ruangjiwa.db
rm -rf /var/lib/ruangjiwa/avatars
mkdir /var/lib/ruangjiwa/avatars
tar -C /var/lib/ruangjiwa -xzf /backups/ruangjiwa/avatars-YYYYMMDD-HHMMSS.tar.gz
chown -R ruangjiwa:ruangjiwa /var/lib/ruangjiwa
sudo -u ruangjiwa env DB_URL=file:/var/lib/ruangjiwa/ruangjiwa.db npm run migrate
sudo systemctl start ruangjiwa-api
```

## Caddy TLS example

```caddyfile
api.example.test {
    reverse_proxy 127.0.0.1:3000
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
    }
}
```

Caddy obtains and renews TLS certificates automatically. Set `AUTH_URL=https://api.example.test` and use the exact browser origin in `WEB_ORIGIN`; do not enable credentialed wildcard CORS.
