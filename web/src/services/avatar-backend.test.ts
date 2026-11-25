import { beforeEach, expect, it, vi } from "vitest";
import { createBackend } from "./firebase";
const b = vi.hoisted(() => ({
  user: { uid: "a", displayName: "Old", photoURL: "https://example.test/old", email: "a@example.test" } as {uid: string; displayName: string; photoURL: string | null; email: string},
  record: {} as Record<string, unknown>, bytes: new Blob(["image"], {type: "image/png"}),
  upload: vi.fn(), read: vi.fn(), update: vi.fn(), set: vi.fn(), storage: vi.fn(),
}));
vi.mock("firebase/app", () => ({ getApps: () => [{}] }));
vi.mock("firebase/auth", () => ({ getAuth: () => ({currentUser: b.user}), updateProfile: b.update }));
vi.mock("firebase/firestore/lite", () => ({ getFirestore: () => ({}), doc: () => ({}), getDoc: async () => ({exists: () => true, data: () => b.record}), setDoc: b.set, deleteField: () => "DELETE" }));
vi.mock("firebase/storage", () => ({ getStorage: b.storage, ref: (_: unknown, path: string) => ({fullPath: path}), uploadBytes: b.upload, getBlob: b.read, getMetadata: async () => ({contentType: b.bytes.type, size: b.bytes.size}) }));
const env = Object.fromEntries(["API_KEY", "AUTH_DOMAIN", "PROJECT_ID", "STORAGE_BUCKET", "APP_ID"].map(k => ["VITE_FIREBASE_" + k, k === "STORAGE_BUCKET" ? "demo-ruangjiwa.appspot.com" : "test"]));
const photo = () => new File(["image"], "photo.png", {type: "image/png"});
beforeEach(() => {
  vi.clearAllMocks();
  b.user.uid = "a"; b.user.displayName = "Old"; b.user.photoURL = "https://example.test/old";
  b.record = {name: "Old", photoUrl: "https://example.test/old", profileImageUrl: "https://example.test/old"};
  b.bytes = new Blob(["image"], {type: "image/png"});
  b.read.mockImplementation(async () => b.bytes);
  b.update.mockImplementation(async (_: unknown, values: object) => Object.assign(b.user, values));
  b.set.mockImplementation(async (_: unknown, values: Record<string, unknown>) => { for (const [k,v] of Object.entries(values)) {if (v === "DELETE") delete b.record[k]; else b.record[k] = v;} });
});
it("new upload verifies bytes Auth name/no URL and Firestore path/deletions; name-only preserves legacy", async () => {
  const backend = createBackend(env)!;
  await backend.saveProfile("a", " Name ");
  expect(b.user.photoURL).toBe("https://example.test/old");
  expect(b.record.photoUrl).toBe("https://example.test/old");
  await backend.saveProfile("a", "New", photo());
  expect(b.record.profileImagePath).toMatch(/^profile_images\/a\/[a-z0-9-]+$/);
  expect(b.record).not.toHaveProperty("photoUrl"); expect(b.record).not.toHaveProperty("profileImageUrl");
  expect(b.user.photoURL).toBe(""); expect(b.user.displayName).toBe("New");
  expect(b.read).toHaveBeenCalledWith(expect.objectContaining({fullPath: b.record.profileImagePath}), 5 * 1024 * 1024);
  expect(b.storage).toHaveBeenCalledTimes(1);
});
it("read is lazy owner scoped and rejects invalid paths MIME and byte overflow", async () => {
  const backend = createBackend(env)!;
  await backend.profile("a"); expect(b.storage).not.toHaveBeenCalled();
  for (const path of ["profile_images/b/x", "profile_images/a/../x", "https://evil.test/x"]) await expect(backend.getPhoto!("a", path)).rejects.toThrow();
  expect(b.storage).not.toHaveBeenCalled();
  expect((await backend.getPhoto!("a", "profile_images/a/x")).size).toBe(b.bytes.size);
  for (const blob of [new Blob(["svg"], {type: "image/svg+xml"}), new Blob([], {type: "image/png"}), new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], {type: "image/png"})]) { b.bytes = blob; await expect(backend.getPhoto!("a", "profile_images/a/x")).rejects.toThrow("invalid-photo"); }
  b.bytes = new Blob(["image"], {type: "image/png"});
  b.read.mockImplementation(async () => {b.user.uid = "b"; return new Blob(["image"], {type: "image/png"});});
  await expect(backend.getPhoto!("a", "profile_images/a/x")).rejects.toThrow("session-changed");
});
it("rejects invalid upload before writes and exposes partial mutation and verification failures", async () => {
  const backend = createBackend(env)!;
  for (const file of [new File([], "empty.png", {type:"image/png"}), new File(["svg"], "x.svg", {type:"image/svg+xml"}), new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.png", {type:"image/png"})]) await expect(backend.saveProfile("a", "New", file)).rejects.toThrow("invalid-photo");
  expect(b.upload).not.toHaveBeenCalled(); expect(b.update).not.toHaveBeenCalled();
  b.set.mockRejectedValueOnce(new Error("permission-denied"));
  await expect(backend.saveProfile("a", "New", photo())).rejects.toThrow(/sebagian/i);
  expect(b.user.displayName).toBe("New"); expect(b.record.name).toBe("Old");
  b.set.mockImplementation(async () => {});
  await expect(backend.saveProfile("a", "Retry", photo())).rejects.toThrow(/sebagian/i);
});
it("preserves verified MIME when bounded Firebase getBlob slicing drops type; rejects truncated bytes", async () => {
  const backend = createBackend(env)!;
  b.read.mockResolvedValueOnce(new Blob(["image"]));
  expect((await backend.getPhoto!("a", "profile_images/a/x")).type).toBe("image/png");
  b.read.mockResolvedValueOnce(new Blob(["short"])); b.bytes = new Blob(["longer"], {type:"image/png"});
  await expect(backend.getPhoto!("a", "profile_images/a/x")).rejects.toThrow("invalid-photo");
});
it("legacy URL rendering parses only owner configured bucket and never mutates existing fields", async () => {
  b.record = {name: "Old", profileImageUrl: "https://firebasestorage.googleapis.com/v0/b/demo-ruangjiwa.appspot.com/o/profile_images%2Fa%2Fx?alt=media&token=old"};
  expect(await createBackend(env)!.profile("a")).toMatchObject({profileImagePath: "profile_images/a/x"});
  expect(b.set).not.toHaveBeenCalled(); expect(b.update).not.toHaveBeenCalled();
});
