import { it, expect, vi } from "vitest";
import { createBackend } from "./firebase";
const boundary = vi.hoisted(() => ({
  user: {
    uid: "a",
    displayName: "Old",
    email: "a@example.test",
    photoURL: null as string | null,
  },
  record: { name: "Old" } as Record<string, unknown>,
  update: vi.fn(),
  set: vi.fn(),
}));
vi.mock("firebase/app", () => ({ getApps: () => [{}] }));
vi.mock("firebase/auth", () => ({
  getAuth: () => ({ currentUser: boundary.user }),
  updateProfile: boundary.update,
}));
vi.mock("firebase/firestore/lite", () => ({
  getFirestore: () => ({}),
  doc: (...args: unknown[]) => args,
  getDoc: async () => ({ exists: () => true, data: () => boundary.record }),
  setDoc: boundary.set,
}));
it("returns an owned image path instead of a durable bearer URL", async () => {
  boundary.record = { name: "Old", profileImagePath: "profile_images/a/avatar.png", profileImageUrl: "https://example.test/legacy" };
  const profile = await createBackend(env)!.profile("a");
  expect(profile).toMatchObject({ profileImagePath: "profile_images/a/avatar.png" });
  expect(profile?.photoUrl).toBeUndefined();
  boundary.record = { name: "Old" };
});
const env = Object.fromEntries(
  ["API_KEY", "AUTH_DOMAIN", "PROJECT_ID", "STORAGE_BUCKET", "APP_ID"].map(
    (k) => ["VITE_FIREBASE_" + k, "test-identifier"],
  ),
);
it("verifies both Auth and users profile data before reporting a profile save", async () => {
  const backend = createBackend(env)!;
  await expect(backend.saveProfile("a", "New")).rejects.toThrow();
  boundary.update.mockImplementation(
    async (_user: unknown, updates: { displayName: string }) => {
      boundary.user.displayName = updates.displayName;
    },
  );
  boundary.set.mockImplementation(
    async (_ref: unknown, data: Record<string, unknown>) => {
      boundary.record = data;
    },
  );
  await expect(backend.saveProfile("a", "New")).resolves.toBeUndefined();
  expect(boundary.set).toHaveBeenLastCalledWith(
    expect.anything(),
    { name: "New" },
    { merge: true },
  );
});
