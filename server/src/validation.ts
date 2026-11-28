import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db/client.js";
import { account, consultations, journals, moods, psychologists, quizHistory, user } from "./db/schema.js";

const moodValues = ["very_sad", "sad", "neutral", "happy", "very_happy"] as const;
const iso = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/).refine((v) => { const date = new Date(v); return Number.isFinite(date.getTime()) && date.toISOString() === v; }, "invalid ISO timestamp");
const identifier = z.string().min(1).max(128).refine((v) => !v.includes("/"));
const mood = z.enum(moodValues);
const base = { userId: z.never().optional(), id: z.never().optional() };
const journalFields = { title: z.string().max(160).optional(), content: z.string().min(10).max(10000), mood: mood.optional(), prompt: z.string().max(1000).optional(), tags: z.array(z.string().min(1).max(40)).max(10).optional(), isFavorite: z.boolean().optional(), createdAt: iso.optional() };
export const journalCreate = z.object({ ...base, ...journalFields }).strict().required({ content: true, createdAt: true });
export const journalUpdate = z.object({ ...base, ...journalFields }).strict().partial();
export const moodCreate = z.object({ ...base, mood, note: z.string().max(2000).optional(), createdAt: iso }).strict();
export const quizCreate = z.object({ ...base, quizType: z.enum(["stress", "anxiety"]), score: z.number().int().min(0).max(15), category: z.enum(["low", "moderate", "high"]), takenAt: iso }).strict().superRefine((v, ctx) => { const expected = v.score <= 6 ? "low" : v.score <= 12 ? "moderate" : "high"; if (v.category !== expected) ctx.addIssue({ code: "custom", path: ["category"], message: "category does not match score" }); });
export const consultationCreate = z.object({ ...base, psychologistId: identifier, status: z.literal("pending"), scheduledAt: iso, notes: z.string().max(2000).optional() }).strict().superRefine((v, ctx) => { if (Date.parse(v.scheduledAt) <= Date.now()) ctx.addIssue({ code: "custom", path: ["scheduledAt"], message: "future time required" }); });
export const consultationUpdate = z.object({ ...base, status: z.literal("canceled") }).strict();
export const profileUpdate = z.object({ name: z.string().trim().min(1).max(100) }).strict();

export type Collection = "journals" | "moods" | "quizHistory" | "consultations";
const tableFor = { journals, moods, quizHistory, consultations } as const;
export function validationError(error: z.ZodError) { return { error: "validation_error", details: error.flatten().fieldErrors }; }
export function jsonValue(value: unknown): unknown { return value instanceof Date ? value.toISOString() : value; }
export async function listRows(collection: Collection, userId: string) { const table = tableFor[collection]; return db.select().from(table).where(eq(table.userId, userId)); }
export async function findOwned(collection: Collection, userId: string, id: string) { const table = tableFor[collection]; const rows = await db.select().from(table).where(and(eq(table.id, id), eq(table.userId, userId))).limit(1); return rows[0]; }
async function ensureAvatarDir(dataDir: string) { await mkdir(dataDir, { recursive: true }); }
export async function saveAvatar(dataDir: string, userId: string, file: File): Promise<{ path: string; bytes: Uint8Array; type: string }> {
  if (file.size < 1 || file.size > 5 * 1024 * 1024) throw new Error("avatar_size");
  const bytes = new Uint8Array(await file.arrayBuffer());
  let type: string | undefined; let ext: string | undefined;
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) { type = "image/jpeg"; ext = "jpg"; }
  else if (bytes.length >= 8 && bytes.slice(0, 8).every((v, i) => v === [137,80,78,71,13,10,26,10][i])) { type = "image/png"; ext = "png"; }
  else if (bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP") { type = "image/webp"; ext = "webp"; }
  if (!type || file.type !== type) throw new Error("avatar_type");
  await ensureAvatarDir(dataDir); const filename = `${userId}-${randomUUID()}.${ext}`; await writeFile(join(dataDir, filename), bytes, { flag: "wx" }); return { path: filename, bytes, type };
}
export async function deleteAvatar(dataDir: string, path: string | null | undefined) { if (path && !path.includes("/") && path.length < 300) await unlink(join(dataDir, path)).catch(() => undefined); }
