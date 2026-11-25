import { afterEach, expect, it, vi } from "vitest";
import { getApps, deleteApp } from "firebase/app";
import { createBackend } from "./firebase";
import { journalDraft } from "../features/journal";

vi.mock("firebase/auth", () => ({
  getAuth: () => ({ currentUser: { uid: "owner" } }),
}));
afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(getApps().map(deleteApp));
});
it("serializes mood removal with the real Firestore SDK and reads its absent field back", async () => {
  const env = Object.fromEntries(
    ["API_KEY", "AUTH_DOMAIN", "PROJECT_ID", "STORAGE_BUCKET", "APP_ID"].map(
      (key) => ["VITE_FIREBASE_" + key, "test-identifier"],
    ),
  );
  const documentName = "projects/test-identifier/databases/(default)/documents/journals/entry";
  let fields: Record<string, { stringValue: string } | { booleanValue: boolean } | { arrayValue: unknown }> = {
    userId: { stringValue: "owner" },
    content: { stringValue: "Long existing journal content" },
    createdAt: { stringValue: "2026-01-01T00:00:00.000Z" },
    mood: { stringValue: "happy" },
  };
  const commits: Record<string, unknown>[] = [];
  // A local wire fixture, not a Firestore backend or persistence claim.
  const transport = vi.fn(async (url: string, options: RequestInit) => {
    const request = JSON.parse(options.body as string);
    if (url.endsWith(":batchGet")) {
      return new Response(JSON.stringify([{ found: {
        name: documentName, fields,
        createTime: "2026-01-01T00:00:00.000Z",
        updateTime: "2026-01-01T00:00:00.000Z",
      } }]), { status: 200 });
    }
    expect(url.endsWith(":commit")).toBe(true);
    const write = request.writes[0];
    commits.push(write);
    for (const key of write.updateMask.fieldPaths) {
      if (Object.hasOwn(write.update.fields, key)) fields[key] = write.update.fields[key];
      else delete fields[key];
    }
    return new Response(JSON.stringify({
      commitTime: "2026-01-01T00:00:00.000Z",
      writeResults: [{ updateTime: "2026-01-01T00:00:00.000Z" }],
    }), { status: 200 });
  });
  vi.stubGlobal("fetch", transport);
  const backend = createBackend(env)!;
  await backend.update("journals", "owner", "entry",
    journalDraft({ content: "Long existing journal content", mood: "" },
      new Date("2026-01-01T00:00:00.000Z")));
  expect(commits).toHaveLength(1);
  expect(commits[0]).toMatchObject({
    update: { name: documentName },
    updateMask: { fieldPaths: expect.arrayContaining(["mood"]) },
  });
  expect((commits[0].update as { fields: unknown }).fields).not.toHaveProperty("mood");
  expect(fields).not.toHaveProperty("mood");
  expect(transport).toHaveBeenCalledTimes(3);
});
