import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { schema } from "./schema.js";

export function dbUrl(): string {
  const value = process.env.DB_URL ?? "file:./data/ruangjiwa.db";
  if (!value.startsWith("file:") && !value.startsWith("libsql://")) throw new Error("DB_URL must be a local file: or libsql: URL");
  return value;
}
const url = dbUrl();
if (url.startsWith("file:")) mkdirSync(dirname(url.slice(5)), { recursive: true });
export const client = createClient({ url, authToken: process.env.DB_AUTH_TOKEN });
export const db = drizzle(client, { schema });
