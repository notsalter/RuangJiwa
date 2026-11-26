import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth";
import { db } from "./db/client.js";
import { account, session, user, verification } from "./db/schema.js";

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret || secret.length < 32) throw new Error("BETTER_AUTH_SECRET is required and must be at least 32 characters");
const trustedOrigins = (process.env.TRUSTED_ORIGINS ?? process.env.WEB_ORIGIN ?? "http://localhost:5173").split(",").map((value) => value.trim()).filter(Boolean);
export const auth = betterAuth({
  secret,
  baseURL: process.env.AUTH_URL ?? "http://localhost:3000",
  trustedOrigins,
  database: drizzleAdapter(db, { provider: "sqlite", schema: { user, session, account, verification } }),
  emailAndPassword: { enabled: true },
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  advanced: { useSecureCookies: process.env.NODE_ENV === "production", cookiePrefix: "ruangjiwa" },
  rateLimit: { enabled: true, window: 60, max: 10, storage: "memory" },
});
