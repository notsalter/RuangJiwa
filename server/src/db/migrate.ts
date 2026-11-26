import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { client, dbUrl } from "./client.js";

const statements = [
`CREATE TABLE IF NOT EXISTS user (id text PRIMARY KEY NOT NULL, name text NOT NULL, email text NOT NULL UNIQUE, email_verified integer NOT NULL DEFAULT 0, image text, avatar_path text, created_at integer NOT NULL, updated_at integer NOT NULL)`,
`CREATE TABLE IF NOT EXISTS session (id text PRIMARY KEY NOT NULL, expires_at integer NOT NULL, token text NOT NULL UNIQUE, created_at integer NOT NULL, updated_at integer NOT NULL, ip_address text, user_agent text, user_id text NOT NULL REFERENCES user(id) ON DELETE CASCADE)`,
`CREATE INDEX IF NOT EXISTS session_user_id_idx ON session(user_id)`,
`CREATE TABLE IF NOT EXISTS account (id text PRIMARY KEY NOT NULL, account_id text NOT NULL, provider_id text NOT NULL, user_id text NOT NULL REFERENCES user(id) ON DELETE CASCADE, access_token text, refresh_token text, id_token text, access_token_expires_at integer, refresh_token_expires_at integer, scope text, password text, created_at integer NOT NULL, updated_at integer NOT NULL)`,
`CREATE INDEX IF NOT EXISTS account_user_id_idx ON account(user_id)`,
`CREATE TABLE IF NOT EXISTS verification (id text PRIMARY KEY NOT NULL, identifier text NOT NULL, value text NOT NULL, expires_at integer NOT NULL, created_at integer NOT NULL, updated_at integer NOT NULL)`,
`CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification(identifier)`,
`CREATE TABLE IF NOT EXISTS psychologists (id text PRIMARY KEY NOT NULL, name text NOT NULL, specialization text, bio text, photo_url text, rating integer)`,
`CREATE TABLE IF NOT EXISTS journals (id text PRIMARY KEY NOT NULL, user_id text NOT NULL REFERENCES user(id) ON DELETE CASCADE, title text, content text NOT NULL, mood text, prompt text, tags text, is_favorite integer NOT NULL DEFAULT 0, created_at integer NOT NULL, updated_at integer NOT NULL)`,
`CREATE INDEX IF NOT EXISTS journals_user_id_idx ON journals(user_id)`,
`CREATE TABLE IF NOT EXISTS moods (id text PRIMARY KEY NOT NULL, user_id text NOT NULL REFERENCES user(id) ON DELETE CASCADE, mood text NOT NULL, note text, created_at integer NOT NULL)`,
`CREATE INDEX IF NOT EXISTS moods_user_id_idx ON moods(user_id)`,
`CREATE TABLE IF NOT EXISTS quiz_history (id text PRIMARY KEY NOT NULL, user_id text NOT NULL REFERENCES user(id) ON DELETE CASCADE, quiz_type text NOT NULL, score integer NOT NULL, category text NOT NULL, taken_at integer NOT NULL)`,
`CREATE INDEX IF NOT EXISTS quiz_history_user_id_idx ON quiz_history(user_id)`,
`CREATE TABLE IF NOT EXISTS consultations (id text PRIMARY KEY NOT NULL, user_id text NOT NULL REFERENCES user(id) ON DELETE CASCADE, psychologist_id text NOT NULL REFERENCES psychologists(id), status text NOT NULL, scheduled_at integer NOT NULL, notes text, created_at integer NOT NULL, updated_at integer NOT NULL)`,
`CREATE INDEX IF NOT EXISTS consultations_user_id_idx ON consultations(user_id)`,
];
export async function migrate(): Promise<void> {
  const url = dbUrl();
  if (url.startsWith("file:")) await mkdir(dirname(url.slice(5)), { recursive: true });
  for (const sql of statements) await client.execute(sql);
}
if (import.meta.url === `file://${process.argv[1]}`) migrate().then(() => console.log("migrations applied"));
