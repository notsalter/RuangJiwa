import { it, expect, vi } from "vitest";
import { Session } from "./session";
import type { Backend } from "./types";
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};
it("isolates account switches, queries, mutations and logout callbacks", async () => {
  let notify!: (user: { uid: string; email: string | null } | null) => void;
  const query = deferred<unknown[]>();
  const mutation = deferred<void>();
  const boundary = {
    observe: (cb: typeof notify) => {
      notify = cb;
      return () => {};
    },
    list: vi.fn(() => query.promise),
    profile: async () => null,
    logout: vi.fn(async () => {}),
    create: vi.fn(() => mutation.promise),
  } as unknown as Backend;
  const session = new Session(boundary);
  session.start();
  notify({ uid: "a", email: "a@example.test" });
  const reading = session.load("moods");
  const writing = session.create("moods", {
    mood: "happy",
    createdAt: "2026-01-01",
  });
  notify({ uid: "b", email: "b@example.test" });
  expect(session.snapshot().data).toEqual({});
  query.resolve([{ id: "a-secret", userId: "a" }]);
  mutation.resolve();
  await Promise.all([reading, writing]);
  expect(session.snapshot().user?.uid).toBe("b");
  expect(session.snapshot().data).toEqual({});
  expect(boundary.list).toHaveBeenCalledTimes(1);
  await session.logout();
  notify({ uid: "b", email: "b@example.test" });
  expect(session.snapshot().user).toBeNull();
  expect(session.snapshot().data).toEqual({});
});
it("clears private data synchronously before signout resolves", async () => {
  let notify!: (u: { uid: string; email: null } | null) => void;
  const signout = deferred<void>();
  const session = new Session({
    observe: (cb: typeof notify) => {
      notify = cb;
      return () => {};
    },
    profile: async () => null,
    list: async () => [{ id: "private", userId: "a" }],
    logout: () => signout.promise,
  } as unknown as Backend);
  session.start();
  notify({ uid: "a", email: null });
  await session.load("moods");
  const result = session.logout();
  expect(session.snapshot().user).toBeNull();
  expect(session.snapshot().data).toEqual({});
  signout.resolve();
  await result;
});
