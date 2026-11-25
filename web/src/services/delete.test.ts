import { beforeEach, expect, it, vi } from "vitest";
import { createBackend } from "./firebase";

const boundary = vi.hoisted(() => ({
  user: { uid: "owner" } as { uid: string } | null,
  record: { userId: "owner" } as Record<string, unknown> | undefined,
  get: vi.fn(),
  list: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("firebase/app", () => ({ getApps: () => [{}] }));
vi.mock("firebase/auth", () => ({
  getAuth: () => ({
    get currentUser() {
      return boundary.user;
    },
  }),
}));
vi.mock("firebase/firestore/lite", () => ({
  getFirestore: () => ({}),
  doc: (_db: unknown, collection: string, id: string) => ({ collection, id }),
  collection: (_db: unknown, name: string) => name,
  documentId: () => "__name__",
  where: (field: string, op: string, value: string) => ({ field, op, value }),
  query: (collection: string, ...filters: unknown[]) => ({ collection, filters }),
  getDoc: boundary.get,
  getDocs: boundary.list,
  deleteDoc: boundary.remove,
}));
const env = Object.fromEntries(
  ["API_KEY", "AUTH_DOMAIN", "PROJECT_ID", "STORAGE_BUCKET", "APP_ID"].map(
    (key) => ["VITE_FIREBASE_" + key, "test-identifier"],
  ),
);
beforeEach(() => {
  vi.resetAllMocks();
  boundary.user = { uid: "owner" };
  boundary.record = { userId: "owner" };
  boundary.get.mockImplementation(async () => {
    if (!boundary.record)
      throw Object.assign(new Error("missing document has no owner fields"), {
        code: "permission-denied",
      });
    return { exists: () => true, data: () => boundary.record };
  });
  boundary.remove.mockImplementation(async () => {
    boundary.record = undefined;
  });
  boundary.list.mockImplementation(async () => ({
    docs: boundary.record ? [{ id: "entry", data: () => boundary.record }] : [],
  }));
});

it("verifies owner deletion when owner rules deny getDoc on a missing document", async () => {
  const backend = createBackend(env)!;
  await expect(backend.remove("journals", "owner", "entry")).resolves.toBeUndefined();
  expect(boundary.record).toBeUndefined();
  expect(boundary.get).toHaveBeenCalledTimes(1);
  expect(boundary.remove).toHaveBeenCalledWith({ collection: "journals", id: "entry" });
  expect(boundary.list).toHaveBeenCalledExactlyOnceWith({
    collection: "journals",
    filters: [
      { field: "userId", op: "==", value: "owner" },
      { field: "__name__", op: "==", value: "entry" },
      { field: "__name__", op: ">=", value: "entry" },
    ],
  });
});

it("keeps query authorization when the exact journal no longer exists", async () => {
  boundary.list.mockImplementationOnce(async (request: { filters: { field: string; op: string; value: string }[] }) => {
    if (!request.filters.some(filter => filter.field === "__name__" && filter.op === ">=" && filter.value === "entry"))
      throw Object.assign(new Error("point query requires missing resource owner data"), {
        code: "permission-denied",
      });
    return { docs: [] };
  });
  await expect(
    createBackend(env)!.remove("journals", "owner", "entry"),
  ).resolves.toBeUndefined();
});

it("rejects a snapshot without owner data before deleting", async () => {
  boundary.get.mockResolvedValueOnce({ exists: () => true, data: () => undefined });
  await expect(
    createBackend(env)!.remove("journals", "owner", "entry"),
  ).rejects.toThrow("not-owner");
  expect(boundary.remove).not.toHaveBeenCalled();
  expect(boundary.list).not.toHaveBeenCalled();
});

it("rejects deletion when the owner-filtered readback still contains the journal", async () => {
  boundary.remove.mockResolvedValueOnce(undefined);
  await expect(
    createBackend(env)!.remove("journals", "owner", "entry"),
  ).rejects.toThrow("delete-not-verified");
  expect(boundary.record).toEqual({ userId: "owner" });
  expect(boundary.list).toHaveBeenCalledOnce();
});

it.each(["get", "remove", "list"] as const)(
  "propagates permission denial from %s instead of reporting deletion success",
  async (stage) => {
    const denied = Object.assign(new Error("access denied"), { code: "permission-denied" });
    boundary[stage].mockRejectedValueOnce(denied);
    await expect(
      createBackend(env)!.remove("journals", "owner", "entry"),
    ).rejects.toBe(denied);
    if (stage === "get") expect(boundary.remove).not.toHaveBeenCalled();
    if (stage !== "list") expect(boundary.list).not.toHaveBeenCalled();
  },
);

it("rejects another owner's journal before deleting", async () => {
  boundary.record = { userId: "other" };
  await expect(
    createBackend(env)!.remove("journals", "owner", "entry"),
  ).rejects.toThrow("not-owner");
  expect(boundary.remove).not.toHaveBeenCalled();
  expect(boundary.list).not.toHaveBeenCalled();
});

it("rejects a nonexisting journal before deleting", async () => {
  boundary.get.mockResolvedValueOnce({ exists: () => false, data: () => undefined });
  await expect(
    createBackend(env)!.remove("journals", "owner", "entry"),
  ).rejects.toThrow("not-owner");
  expect(boundary.remove).not.toHaveBeenCalled();
  expect(boundary.list).not.toHaveBeenCalled();
});

it("requires the current owner session before reading the journal", async () => {
  boundary.user = null;
  await expect(
    createBackend(env)!.remove("journals", "owner", "entry"),
  ).rejects.toThrow("session-changed");
  expect(boundary.get).not.toHaveBeenCalled();
  expect(boundary.remove).not.toHaveBeenCalled();
  expect(boundary.list).not.toHaveBeenCalled();
});

it.each(["get", "remove", "list"] as const)(
  "rejects an account switch during the %s await",
  async (stage) => {
    const operation = boundary[stage].getMockImplementation()!;
    boundary[stage].mockImplementationOnce(async (...args: unknown[]) => {
      const result = await operation(...args);
      boundary.user = { uid: "other" };
      return result;
    });
    await expect(
      createBackend(env)!.remove("journals", "owner", "entry"),
    ).rejects.toThrow("session-changed");
    if (stage === "get") expect(boundary.remove).not.toHaveBeenCalled();
    if (stage !== "list") expect(boundary.list).not.toHaveBeenCalled();
  },
);
