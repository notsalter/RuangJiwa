import { cors } from "hono/cors";
import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { auth } from "./auth.js";
import { db } from "./db/client.js";
import { account, consultations, journals, moods, psychologists, quizHistory, user } from "./db/schema.js";
import { consultationCreate, consultationUpdate, findOwned, journalCreate, journalUpdate, listRows, moodCreate, profileUpdate, quizCreate, rowJson, saveAvatar, deleteAvatar, validationError, type Collection } from "./validation.js";

export type AppEnv = { Variables: { userId: string } };
const dataDir = process.env.DATA_DIR ?? "./data/avatars";
const app = new Hono<AppEnv>();
const privateCollections: Collection[] = ["journals", "moods", "quizHistory", "consultations"];

app.use("*", async (c, next) => {
  c.header("X-Content-Type-Options", "nosniff"); c.header("X-Frame-Options", "DENY"); c.header("Referrer-Policy", "no-referrer"); c.header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'"); c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (c.req.method !== "GET") { const length = Number(c.req.header("content-length") ?? 0); if (length > 11 * 1024 * 1024) return c.json({ error: "payload_too_large" }, 413); }
  await next();
});
const webOrigin = process.env.WEB_ORIGIN;
if (webOrigin) app.use("*", cors({ origin: webOrigin, credentials: true, allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"], allowHeaders: ["Content-Type", "Authorization"] }));

async function sessionUser(c: { req: { raw: Request } }) {
  const result = await auth.api.getSession({ headers: c.req.raw.headers });
  return result?.user;
}
async function requireUser(c: any, next: () => Promise<Response | void>) {
  const current = await sessionUser(c);
  if (!current) return c.json({ error: "unauthorized" }, 401);
  c.set("userId", current.id); return next();
}
function safeJson(c: any, payload: unknown, status = 200) { return c.json(payload, status); }
async function body(c: any) { try { return await c.req.json(); } catch { return null; } }
function bad(c: any, parsed: { success: false; error: any }) { return safeJson(c, validationError(parsed.error), 422); }
function output(row: Record<string, unknown>) { return rowJson(row); }

app.get("/api/health", (c) => c.json({ status: "ok" }));
app.all("/api/auth/*", (c) => auth.handler(c.req.raw));

app.get("/api/profile", requireUser, async (c) => {
  const current = await sessionUser(c); if (!current) return c.json({ error: "unauthorized" }, 401);
  const row = await db.select({ avatarPath: user.avatarPath }).from(user).where(eq(user.id, current.id)).limit(1);
  return c.json({ name: current.name, email: current.email, avatarPath: row[0]?.avatarPath ?? null });
});
app.patch("/api/profile", requireUser, async (c) => {
  const parsed = profileUpdate.safeParse(await body(c)); if (!parsed.success) return bad(c, parsed);
  const userId = c.get("userId"); await db.update(user).set({ name: parsed.data.name, updatedAt: new Date() }).where(eq(user.id, userId));
  const updated = await db.select({ name: user.name, email: user.email, avatarPath: user.avatarPath }).from(user).where(eq(user.id, userId)).limit(1); return c.json(updated[0]);
});
app.post("/api/profile/avatar", requireUser, async (c) => {
  const form = await c.req.formData().catch(() => null); const file = form?.get("avatar") ?? form?.get("file");
  if (!(file instanceof File)) return c.json({ error: "avatar_file_required" }, 422);
  try {
    const saved = await saveAvatar(dataDir, c.get("userId"), file); const old = await db.select({ avatarPath: user.avatarPath }).from(user).where(eq(user.id, c.get("userId"))).limit(1);
    await db.update(user).set({ avatarPath: saved.path, updatedAt: new Date() }).where(eq(user.id, c.get("userId"))); await deleteAvatar(dataDir, old[0]?.avatarPath);
    return c.json({ avatarPath: saved.path });
  } catch (error) { return c.json({ error: error instanceof Error && error.message === "avatar_size" ? "avatar_too_large" : "invalid_avatar" }, 422); }
});
app.get("/api/avatar/:file", requireUser, async (c) => {
  const filename = c.req.param("file"); if (!/^[A-Za-z0-9-]+\.(?:jpg|png|webp)$/.test(filename)) return c.json({ error: "not_found" }, 404);
  const owned = await db.select({ avatarPath: user.avatarPath }).from(user).where(and(eq(user.id, c.get("userId")), eq(user.avatarPath, filename))).limit(1); if (!owned[0]) return c.json({ error: "not_found" }, 404);
  try { const bytes = await readFile(join(dataDir, filename)); const type = filename.endsWith(".jpg") ? "image/jpeg" : filename.endsWith(".png") ? "image/png" : "image/webp"; return new Response(bytes, { headers: { "Content-Type": type, "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" } }); } catch { return c.json({ error: "not_found" }, 404); }
});

app.get("/api/psychologists", requireUser, async (c) => c.json((await db.select().from(psychologists)).map(output)));

for (const collection of privateCollections) {
  const path = collection === "quizHistory" ? "/api/quiz-history" : `/api/${collection}`;
  app.get(path, requireUser, async (c) => c.json((await listRows(collection, c.get("userId"))).map(output)));
  app.post(path, requireUser, async (c) => {
    const data = await body(c); const parsed = (collection === "journals" ? journalCreate : collection === "moods" ? moodCreate : collection === "quizHistory" ? quizCreate : consultationCreate).safeParse(data);
    if (!parsed.success) return bad(c, parsed);
    const now = new Date(); const id = crypto.randomUUID(); const value: any = { ...parsed.data, id, userId: c.get("userId") };
    if (collection === "journals") { value.createdAt = new Date(value.createdAt); value.updatedAt = now; }
    if (collection === "moods" || collection === "quizHistory") { value[collection === "moods" ? "createdAt" : "takenAt"] = new Date(value[collection === "moods" ? "createdAt" : "takenAt"]); }
    if (collection === "consultations") { value.scheduledAt = new Date(value.scheduledAt); value.createdAt = now; value.updatedAt = now; const psychologist = await db.select({ id: psychologists.id }).from(psychologists).where(eq(psychologists.id, value.psychologistId)).limit(1); if (!psychologist[0]) return c.json({ error: "psychologist_not_found" }, 422); }
    const table: any = { journals, moods, quizHistory, consultations }[collection]; await db.insert(table).values(value); const rows = await db.select().from(table).where(eq(table.id, id)).limit(1); return c.json(output(rows[0] as Record<string, unknown>), 201);
  });
}
app.patch("/api/journals/:id", requireUser, async (c) => {
  const parsed = journalUpdate.safeParse(await body(c)); if (!parsed.success) return bad(c, parsed); const existing = await findOwned("journals", c.get("userId"), c.req.param("id")); if (!existing) return c.json({ error: "not_found" }, 404);
  const value: any = { ...parsed.data, updatedAt: new Date() }; if (value.createdAt) value.createdAt = new Date(value.createdAt); await db.update(journals).set(value).where(and(eq(journals.id, existing.id), eq(journals.userId, c.get("userId")))); const updated = await findOwned("journals", c.get("userId"), existing.id); return c.json(output(updated as any));
});
app.delete("/api/journals/:id", requireUser, async (c) => { const existing = await findOwned("journals", c.get("userId"), c.req.param("id")); if (!existing) return c.json({ error: "not_found" }, 404); await db.delete(journals).where(and(eq(journals.id, existing.id), eq(journals.userId, c.get("userId")))); return c.body(null, 204); });
app.patch("/api/consultations/:id", requireUser, async (c) => {
  const parsed = consultationUpdate.safeParse(await body(c)); if (!parsed.success) return bad(c, parsed); const existing = await findOwned("consultations", c.get("userId"), c.req.param("id")); if (!existing) return c.json({ error: "not_found" }, 404); if ((existing as { status: string }).status !== "pending") return c.json({ error: "invalid_transition" }, 422);
  await db.update(consultations).set({ status: "canceled", updatedAt: new Date() }).where(and(eq(consultations.id, existing.id), eq(consultations.userId, c.get("userId")))); return c.json(output((await findOwned("consultations", c.get("userId"), existing.id)) as any));
});

app.notFound((c) => c.json({ error: "not_found" }, 404));
app.onError((error, c) => { console.error(error.message); return c.json({ error: "internal_error" }, 500); });
export { app };
