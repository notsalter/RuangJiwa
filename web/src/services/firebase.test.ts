import { beforeEach, it, expect, vi } from "vitest";
import { deleteField, type FieldValue } from "firebase/firestore/lite";
import type { PrivateCollection } from "../core/types";
import { createBackend } from "./firebase";
import { journalDraft } from "../features/journal";
const journal = {
  userId: "owner",
  content: "Long existing journal content",
  createdAt: "2026-01-01T00:00:00.000Z",
};
const boundary = vi.hoisted(() => ({
  user: { uid: "owner" },
  set: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  add: vi.fn(),
  directoryExists: true,
  data: { userId: "someone-else" } as Record<string, unknown>,
}));
vi.mock("firebase/app", () => ({
  initializeApp: () => ({}),
  getApps: () => [],
}));
vi.mock("firebase/auth", () => ({
  getAuth: () => ({
    get currentUser() {
      return boundary.user;
    },
  }),
}));
vi.mock("firebase/firestore/lite", async (importOriginal) => ({
  ...(await importOriginal<typeof import("firebase/firestore/lite")>()),
  getFirestore: () => ({}),
  collection: (...args: unknown[]) => args,
  doc: (...args: unknown[]) => args,
  getDoc: async (ref: unknown[]) => ref[1] === "psychologists"
    ? { exists: () => boundary.directoryExists, data: () => ({ name: "Directory entry" }) }
    : { exists: () => true, data: () => boundary.data },
  updateDoc: boundary.update,
  deleteDoc: boundary.remove,
  setDoc: boundary.set,
  addDoc: boundary.add,
}));
const env = Object.fromEntries(
  ["API_KEY", "AUTH_DOMAIN", "PROJECT_ID", "STORAGE_BUCKET", "APP_ID"].map(
    (k) => ["VITE_FIREBASE_" + k, "test-identifier"],
  ),
);
beforeEach(() => {
  boundary.user = { uid: "owner" };
  boundary.directoryExists = true;
  boundary.data = { userId: "someone-else" };
  vi.resetAllMocks();
});
function applyUpdate(_ref: unknown, payload: Record<string, unknown>) {
  for (const [key, value] of Object.entries(payload)) {
    if (value && typeof value === "object" && "isEqual" in value &&
        (value as FieldValue).isEqual(deleteField())) delete boundary.data[key];
    else boundary.data[key] = value;
  }
}
it("clears a journal mood through a real SDK deleteField sentinel and reads back its absence", async () => {
  boundary.data = { ...journal, mood: "happy" };
  boundary.update.mockImplementation(applyUpdate);
  await createBackend(env)!.update("journals", "owner", "entry",
    journalDraft({ content: journal.content, mood: "" }, new Date(journal.createdAt)));
  expect(boundary.update).toHaveBeenCalledOnce();
  const payload = boundary.update.mock.calls[0][1];
  expect(payload.mood?.isEqual(deleteField())).toBe(true);
  expect(boundary.data).not.toHaveProperty("mood");
});
it.each([
  { mood: "invalid", createdAt: "not-a-date" },
  { mood: "happy" },
  { mood: "happy", createdAt: "2026-02-30T00:00:00.000Z" },
  { mood: "happy", createdAt: journal.createdAt, note: null },
  { mood: "happy", createdAt: journal.createdAt, note: "x".repeat(2001) },
  { mood: "happy", createdAt: journal.createdAt, unknown: true },
  { mood: "happy", createdAt: journal.createdAt, id: "forged" },
  { mood: "happy", createdAt: journal.createdAt, userId: "someone-else" },
  { mood: "happy", createdAt: journal.createdAt, userId: "owner" },
  { mood: "happy", createdAt: journal.createdAt, id: undefined },
])("denies malformed mood create %# before an SDK write", async (data) => {
  await expect(createBackend(env)!.create("moods", "owner", data)).rejects.toThrow("invalid-record-schema");
  expect(boundary.add).not.toHaveBeenCalled();
});
it.each([
  ["journals", { title: "incomplete" }],
  ["journals", { content: "short", createdAt: journal.createdAt }],
  ["journals", { content: "x".repeat(10001), createdAt: journal.createdAt }],
  ["journals", { content: journal.content, createdAt: journal.createdAt, title: "x".repeat(161) }],
  ["journals", { content: journal.content, createdAt: journal.createdAt, prompt: "x".repeat(1001) }],
  ["journals", { content: journal.content, createdAt: journal.createdAt, tags: [""] }],
  ["journals", { content: journal.content, createdAt: journal.createdAt, tags: Array(11).fill("tag") }],
  ["journals", { content: journal.content, createdAt: journal.createdAt, tags: ["x".repeat(41)] }],
  ["journals", { content: journal.content, createdAt: journal.createdAt, isFavorite: null }],
  ["quizHistory", { quizType: "unknown", score: 6, category: "low", takenAt: journal.createdAt }],
  ["quizHistory", { quizType: "stress", score: 7, category: "low", takenAt: journal.createdAt }],
  ["quizHistory", { quizType: "anxiety", score: 13, category: "moderate", takenAt: journal.createdAt }],
  ["quizHistory", { quizType: "stress", score: 1.5, category: "low", takenAt: journal.createdAt }],
  ["quizHistory", { quizType: "stress", score: 16, category: "high", takenAt: journal.createdAt }],
  ["consultations", { psychologistId: "p", status: "pending" }],
  ["consultations", { psychologistId: "p/q", status: "pending", scheduledAt: "2099-01-01T00:00:00.000Z" }],
  ["consultations", { psychologistId: "p", status: "confirmed", scheduledAt: "2099-01-01T00:00:00.000Z" }],
  ["consultations", { psychologistId: "p", status: "pending", scheduledAt: journal.createdAt }],
  ["consultations", { psychologistId: "p", status: "pending", scheduledAt: "2099-01-01T00:00:00.000Z", notes: "x".repeat(2001) }],
] as const)("denies invalid %s create %# before an SDK write", async (name, data) => {
  await expect(createBackend(env)!.create(name, "owner", data)).rejects.toThrow("invalid-record-schema");
  expect(boundary.add).not.toHaveBeenCalled();
});
it.each([
  { content: undefined }, { createdAt: undefined }, { mood: "unknown" },
  { unknown: undefined }, { title: null }, { "title.nested": "unsafe" },
  { id: "entry" }, { id: undefined }, { userId: "owner" },
  { userId: "someone-else" }, { userId: undefined },
])("denies invalid journal patch %# before an SDK write", async (patch) => {
  boundary.data = { ...journal };
  await expect(createBackend(env)!.update("journals", "owner", "entry", patch)).rejects.toThrow("invalid-record-schema");
  expect(boundary.update).not.toHaveBeenCalled();
});
it.each([
  { ...journal, content: "short" },
  { ...journal, unknown: true },
  { ...journal, mood: null },
])("denies a favorite patch on a malformed merged journal %#", async (record) => {
  boundary.data = record;
  await expect(createBackend(env)!.update("journals", "owner", "entry", { isFavorite: true })).rejects.toThrow("invalid-record-schema");
  expect(boundary.update).not.toHaveBeenCalled();
});
it.each([
  ["moods", { userId: "owner", mood: "happy", createdAt: journal.createdAt }, { mood: undefined }],
  ["quizHistory", { userId: "owner", quizType: "stress", score: 6, category: "low", takenAt: journal.createdAt }, { score: 7 }],
  ["consultations", { userId: "owner", psychologistId: "p", status: "pending", scheduledAt: journal.createdAt }, { notes: "changed" }],
  ["consultations", { userId: "owner", psychologistId: "p", status: "confirmed", scheduledAt: journal.createdAt }, { status: "canceled" }],
  ["consultations", { userId: "owner", psychologistId: "p", status: "pending", scheduledAt: journal.createdAt }, { status: "confirmed" }],
] as const)("denies invalid %s patch %# before an SDK write", async (name, record, patch) => {
  boundary.data = record;
  await expect(createBackend(env)!.update(name, "owner", "entry", patch)).rejects.toThrow("invalid-record-schema");
  expect(boundary.update).not.toHaveBeenCalled();
});
it.each([null, [], "payload", 7, Object.create({ mood: "happy" })])(
  "denies non-record create payload %# before an SDK write", async (data) => {
    await expect(createBackend(env)!.create("moods", "owner", data as Record<string, unknown>)).rejects.toThrow("invalid-record-schema");
    expect(boundary.add).not.toHaveBeenCalled();
  });
it.each([null, [], "payload", 7, Object.create({ title: "bad" })])(
  "denies non-record update payload %# before an SDK write", async (data) => {
    boundary.data = { ...journal };
    await expect(createBackend(env)!.update("journals", "owner", "entry", data as Record<string, unknown>)).rejects.toThrow("invalid-record-schema");
    expect(boundary.update).not.toHaveBeenCalled();
  });
it.each([
  ["moods", { mood: "happy", createdAt: journal.createdAt, note: undefined }],
  ["journals", journalDraft({ content: journal.content, mood: "", tags: "care, rest" }, new Date())],
  ...[0, 6, 7, 12, 13, 15].flatMap((score) => ["stress", "anxiety"].map((quizType) =>
    ["quizHistory", { quizType, score, category: score <= 6 ? "low" : score <= 12 ? "moderate" : "high", takenAt: new Date().toISOString() }])),
  ["consultations", { psychologistId: "p", status: "pending", scheduledAt: "2099-01-01T00:00:00.000Z", notes: "care" }],
] as [PrivateCollection, Record<string, unknown>][])("creates a valid %s record %# omitting undefined fields", async (name, data) => {
  boundary.add.mockImplementation(async (_ref, payload) => { boundary.data = payload; return [name, "new-id"]; });
  await expect(createBackend(env)!.create(name, "owner", data)).resolves.toBeUndefined();
  expect(boundary.add).toHaveBeenCalledOnce();
  expect(Object.values(boundary.data)).not.toContain(undefined);
  expect(boundary.data.userId).toBe("owner");
});
it.each([
  ["journals", { ...journal, title: "old", mood: "happy" }, { isFavorite: true }],
  ["journals", { ...journal, mood: "happy", title: "old", prompt: "prompt", tags: ["tag"] }, { mood: undefined, title: undefined, prompt: undefined, tags: undefined, isFavorite: undefined }],
  ["moods", { userId: "owner", mood: "happy", createdAt: journal.createdAt, note: "old" }, { mood: "sad", note: undefined }],
  ["quizHistory", { userId: "owner", quizType: "stress", score: 6, category: "low", takenAt: journal.createdAt }, { score: 7, category: "moderate" }],
  ["consultations", { userId: "owner", psychologistId: "p", status: "pending", scheduledAt: journal.createdAt }, { status: "canceled" }],
] as const)("updates a valid %s record %# preserving omitted fields", async (name, record, patch) => {
  boundary.data = { ...record };
  boundary.update.mockImplementation(applyUpdate);
  await expect(createBackend(env)!.update(name, "owner", "entry", patch)).resolves.toBeUndefined();
  expect(boundary.update).toHaveBeenCalledOnce();
  expect(boundary.data.userId).toBe("owner");
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) expect(boundary.data).not.toHaveProperty(key);
    else expect(boundary.data[key]).toEqual(value);
  }
  if (name === "journals" && "isFavorite" in patch && patch.isFavorite === true)
    expect(boundary.data.mood).toBe("happy");
});
it("does not verify deletion when readback still contains an undefined optional field", async () => {
  boundary.data = { ...journal, mood: "happy" };
  boundary.update.mockImplementation(() => { boundary.data.mood = undefined; });
  await expect(createBackend(env)!.update("journals", "owner", "entry", { mood: undefined })).rejects.toThrow("write-not-verified");
});
it("rejects readback whose ownership changed despite applying the update", async () => {
  boundary.data = { ...journal };
  boundary.update.mockImplementation(() => { boundary.data = { ...journal, userId: "someone-else", isFavorite: true }; });
  await expect(createBackend(env)!.update("journals", "owner", "entry", { isFavorite: true })).rejects.toThrow("write-not-verified");
});
it("denies sparse journal tags before an SDK write", async () => {
  await expect(createBackend(env)!.create("journals", "owner", {
    content: journal.content, createdAt: journal.createdAt, tags: Array(2),
  })).rejects.toThrow("invalid-record-schema");
  expect(boundary.add).not.toHaveBeenCalled();
});
it("rejects create readback with unknown stored fields", async () => {
  boundary.add.mockImplementation(async (_ref, payload) => {
    boundary.data = { ...payload, unknown: true }; return ["moods", "new-id"];
  });
  await expect(createBackend(env)!.create("moods", "owner", {
    mood: "happy", createdAt: journal.createdAt,
  })).rejects.toThrow("write-not-verified");
});
it("denies consultation create for a missing directory entry before an SDK write", async () => {
  boundary.directoryExists = false;
  boundary.add.mockImplementation(async (_ref, payload) => { boundary.data = payload; return ["consultations", "new-id"]; });
  await expect(createBackend(env)!.create("consultations", "owner", {
    psychologistId: "missing", status: "pending", scheduledAt: "2099-01-01T00:00:00.000Z",
  })).rejects.toThrow("invalid-record-schema");
  expect(boundary.add).not.toHaveBeenCalled();
});
it.each(["psychologists", "unknown", "toString", "__proto__"])(
  "denies unauthorized collection %s before an SDK write", async (name) => {
    const backend = createBackend(env)!;
    boundary.data = { ...journal };
    await expect(backend.create(name as PrivateCollection, "owner", { content: journal.content, createdAt: journal.createdAt })).rejects.toThrow("invalid-record-schema");
    await expect(backend.update(name as PrivateCollection, "owner", "entry", { title: "changed" })).rejects.toThrow("invalid-record-schema");
    expect(boundary.add).not.toHaveBeenCalled();
    expect(boundary.update).not.toHaveBeenCalled();
  });
it("verifies exact record after a create or update and verifies deletion before success", async () => {
  boundary.data = { ...journal, title: "old" };
  boundary.add.mockResolvedValue(["journals", "new-id"]);
  const backend = createBackend(env)!;
  await expect(
    backend.create("journals", "owner", {
      content: journal.content, createdAt: journal.createdAt, title: "new",
    }),
  ).rejects.toThrow();
  await expect(
    backend.update("journals", "owner", "entry", { title: "new" }),
  ).rejects.toThrow();
  await expect(backend.remove("journals", "owner", "entry")).rejects.toThrow();
  boundary.data = { ...journal, title: "new" };
  await expect(
    backend.create("journals", "owner", {
      content: journal.content, createdAt: journal.createdAt, title: "new",
    }),
  ).resolves.toBeUndefined();
  boundary.data = { userId: "someone-else" };
  boundary.update.mockClear();
  boundary.remove.mockClear();
  boundary.add.mockClear();
});
it("requires complete configuration and denies cross-user writes before Firestore update", async () => {
  expect(createBackend({})).toBeNull();
  const backend = createBackend(env)!;
  await expect(
    backend.update("journals", "owner", "other-entry", { title: "new title" }),
  ).rejects.toThrow();
  expect(boundary.update).not.toHaveBeenCalled();
  await expect(
    backend.remove("journals", "owner", "other-entry"),
  ).rejects.toThrow();
  expect(boundary.remove).not.toHaveBeenCalled();
  await expect(
    backend.create("moods", "different-account", { mood: "happy" }),
  ).rejects.toThrow();
  expect(boundary.add).not.toHaveBeenCalled();
});
