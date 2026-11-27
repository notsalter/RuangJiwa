import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

const dir = await mkdtemp(join(tmpdir(), "ruangjiwa-api-"));
process.env.DB_URL = `file:${join(dir, "test.db")}`;
process.env.DATA_DIR = join(dir, "avatars");
process.env.BETTER_AUTH_SECRET = "test-secret-that-is-longer-than-32-characters";
process.env.WEB_ORIGIN = "http://localhost:5173";
process.env.TRUSTED_PROXIES = "127.0.0.1";
const { app } = await import("../src/app.js");
const { migrate } = await import("../src/db/migrate.js");
const { db } = await import("../src/db/client.js");
const { psychologists, session } = await import("../src/db/schema.js");
import { eq } from "drizzle-orm";

const jsonHeaders = { "content-type": "application/json" };
const iso = (delta = 0) => new Date(Date.now() + delta).toISOString();
async function request(path: string, init: RequestInit = {}) { return app.fetch(new Request(`http://localhost${path}`, init)); }
async function json<T>(response: Response): Promise<T> { return response.json() as Promise<T>; }
function cookie(response: Response) { return response.headers.get("set-cookie")?.split(";")[0] ?? ""; }
let ipCounter = 10;
async function signUp(email: string) {
  const response = await request("/api/auth/sign-up/email", { method: "POST", headers: { ...jsonHeaders, "x-forwarded-for": `198.51.100.${ipCounter++}` }, body: JSON.stringify({ name: email.split("@")[0], email, password: "Password123!" }) });
  expect(response.status).toBe(200);
  return { cookie: cookie(response), user: (await json<{ user: { id: string } }>(response)).user };
}
function authInit(authCookie: string, init: RequestInit = {}): RequestInit { return { ...init, headers: { ...(init.headers ?? {}), cookie: authCookie } }; }

beforeAll(async () => { await migrate(); await db.insert(psychologists).values({ id: "psych-1", name: "Dr. Test", specialization: "Anxiety", bio: "Test psychologist", rating: 5 }); });
afterAll(async () => { await rm(dir, { recursive: true, force: true }); });

describe("RuangJiwa self-hosted API", () => {
  it("reports health and rejects missing and expired sessions", async () => {
    expect((await request("/api/health")).status).toBe(200);
    expect((await request("/api/profile")).status).toBe(401);
    const a = await signUp("expired@example.com");
    expect((await request("/api/profile", authInit(a.cookie))).status).toBe(200);
    await db.update(session).set({ expiresAt: new Date(0) }).where(eq(session.userId, a.user.id));
    const expired = await request("/api/profile", authInit(a.cookie));
    expect(expired.status).toBe(401);
    expect((await json<{ error: string }>(expired)).error).toBe("unauthorized");
  });

  it("reports reset delivery as an explicit unconfigured capability", async () => {
    const response = await request("/api/auth/request-password-reset", { method: "POST", headers: jsonHeaders, body: JSON.stringify({ email: "someone@example.test" }) });
    expect(response.status).toBe(501);
    expect(await json<{ error: string }>(response)).toEqual({ error: "auth/reset-not-configured" });
  });

  it("isolates every collection between users", async () => {
    const a = await signUp("owner@example.com"); const b = await signUp("other@example.com");
    const journal = await request("/api/journals", authInit(a.cookie, { method: "POST", headers: jsonHeaders, body: JSON.stringify({ content: "A private journal entry", createdAt: iso() }) }));
    const journalId = (await json<{ id: string }>(journal)).id;
    const mood = await request("/api/moods", authInit(a.cookie, { method: "POST", headers: jsonHeaders, body: JSON.stringify({ mood: "happy", note: "Good", createdAt: iso() }) }));
    expect(mood.status).toBe(201);
    const quiz = await request("/api/quiz-history", authInit(a.cookie, { method: "POST", headers: jsonHeaders, body: JSON.stringify({ quizType: "stress", score: 4, category: "low", takenAt: iso() }) }));
    expect(quiz.status).toBe(201);
    const consultation = await request("/api/consultations", authInit(a.cookie, { method: "POST", headers: jsonHeaders, body: JSON.stringify({ psychologistId: "psych-1", status: "pending", scheduledAt: iso(3600000), notes: "Please help" }) }));
    expect(consultation.status).toBe(201);
    for (const path of ["/api/journals", "/api/moods", "/api/quiz-history", "/api/consultations"]) expect(await json<unknown[]>(await request(path, authInit(b.cookie)))).toEqual([]);
    expect((await request(`/api/journals/${journalId}`, authInit(b.cookie, { method: "PATCH", headers: jsonHeaders, body: JSON.stringify({ title: "hijack" }) }))).status).toBe(404);
    expect((await request(`/api/journals/${journalId}`, authInit(b.cookie, { method: "DELETE" }))).status).toBe(404);
  });

  it("enforces strict validation and consultation transitions", async () => {
    const a = await signUp("validation@example.com");
    const invalid = [
      { content: "short", createdAt: iso() },
      { content: "valid journal content", createdAt: iso(), unknown: true },
    ];
    for (const value of invalid) expect((await request("/api/journals", authInit(a.cookie, { method: "POST", headers: jsonHeaders, body: JSON.stringify(value) }))).status).toBe(422);
    expect((await request("/api/moods", authInit(a.cookie, { method: "POST", headers: jsonHeaders, body: JSON.stringify({ mood: "bad", createdAt: iso() }) }))).status).toBe(422);
    expect((await request("/api/quiz-history", authInit(a.cookie, { method: "POST", headers: jsonHeaders, body: JSON.stringify({ quizType: "stress", score: 15, category: "low", takenAt: iso() }) }))).status).toBe(422);
    expect((await request("/api/consultations", authInit(a.cookie, { method: "POST", headers: jsonHeaders, body: JSON.stringify({ psychologistId: "psych-1", status: "pending", scheduledAt: iso(-1) }) }))).status).toBe(422);
    expect((await request("/api/consultations", authInit(a.cookie, { method: "POST", headers: jsonHeaders, body: JSON.stringify({ psychologistId: "psych-1", status: "pending", scheduledAt: iso(3600000) }) }))).status).toBe(201);
    expect((await request("/api/consultations", authInit(a.cookie, { method: "POST", headers: jsonHeaders, body: JSON.stringify({ psychologistId: "missing", status: "pending", scheduledAt: iso(3600000) }) }))).status).toBe(422);
    const created = await request("/api/consultations", authInit(a.cookie, { method: "POST", headers: jsonHeaders, body: JSON.stringify({ psychologistId: "psych-1", status: "pending", scheduledAt: iso(3600000) }) }));
    const id = (await json<{ id: string }>(created)).id;
    expect((await request(`/api/consultations/${id}`, authInit(a.cookie, { method: "PATCH", headers: jsonHeaders, body: JSON.stringify({ status: "confirmed" }) }))).status).toBe(422);
    expect((await request(`/api/consultations/${id}`, authInit(a.cookie, { method: "PATCH", headers: jsonHeaders, body: JSON.stringify({ status: "canceled" }) }))).status).toBe(200);
  });

  it("supports journal CRUD and owner-only avatar delivery", async () => {
    const a = await signUp("avatar-owner@example.com"); const b = await signUp("avatar-other@example.com");
    const created = await request("/api/journals", authInit(a.cookie, { method: "POST", headers: jsonHeaders, body: JSON.stringify({ content: "A journal entry that can change", createdAt: iso() }) }));
    const id = (await json<{ id: string }>(created)).id;
    expect((await request(`/api/journals/${id}`, authInit(a.cookie, { method: "PATCH", headers: jsonHeaders, body: JSON.stringify({ title: "Changed" }) }))).status).toBe(200);
    expect((await request(`/api/journals/${id}`, authInit(a.cookie, { method: "DELETE" }))).status).toBe(204);
    const validJpeg = new File([new Uint8Array([255, 216, 255, 0, 1])], "avatar.jpg", { type: "image/jpeg" });
    const form = new FormData(); form.append("avatar", validJpeg);
    const uploaded = await request("/api/profile/avatar", authInit(a.cookie, { method: "POST", body: form }));
    expect(uploaded.status).toBe(200); const avatarPath = (await json<{ avatarPath: string }>(uploaded)).avatarPath;
    expect(avatarPath).toMatch(/^[A-Za-z0-9-]+\.jpg$/);
    expect((await request(`/api/avatar/${avatarPath}`, authInit(b.cookie))).status).toBe(404);
    const owned = await request(`/api/avatar/${avatarPath}`, authInit(a.cookie)); expect(owned.status).toBe(200); expect(owned.headers.get("cache-control")).toMatch(/^private/); expect((await owned.arrayBuffer()).byteLength).toBe(5);
    const invalidMagic = new FormData(); invalidMagic.append("avatar", new File(["not an image"], "x.jpg", { type: "image/jpeg" }));
    expect((await request("/api/profile/avatar", authInit(a.cookie, { method: "POST", body: invalidMagic }))).status).toBe(422);
    const tooLarge = new FormData(); tooLarge.append("avatar", new File([new Uint8Array(5 * 1024 * 1024 + 1)], "x.jpg", { type: "image/jpeg" }));
    expect((await request("/api/profile/avatar", authInit(a.cookie, { method: "POST", body: tooLarge }))).status).toBe(422);
  });

  it("lists psychologists and has auth rate limiting", async () => {
    const a = await signUp("psych-list@example.com");
    const listed = await request("/api/psychologists", authInit(a.cookie)); expect(listed.status).toBe(200); expect((await json<{ id: string }[]>(listed)).some((p) => p.id === "psych-1")).toBe(true);
    const missing = await request("/api/psychologists"); expect(missing.status).toBe(401);
    const responses = await Promise.all(Array.from({ length: 112 }, () => request("/api/auth/sign-in/email", { method: "POST", headers: { ...jsonHeaders, "x-forwarded-for": "192.0.2.1" }, body: JSON.stringify({ email: "not-found@example.com", password: "bad" }) })));
    expect(responses.some((response) => response.status === 429)).toBe(true);
  });
});
