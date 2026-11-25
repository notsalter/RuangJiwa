import { it, expect, vi } from "vitest";
import { Session } from "./session";
import type { Backend, User } from "./types";
const deferred = <T>() => {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};
it("holds initial restore pending and never accepts late private profiles after offline clear", async () => {
  let notify!: (u: User | null) => void;
  const profile = deferred<{ id: string; name: string }>();
  const session = new Session({
    observe: (cb: typeof notify) => {
      notify = cb;
      return () => {};
    },
    profile: () => profile.promise,
    list: async () => [],
  } as unknown as Backend);
  session.start();
  expect(session.snapshot().ready).toBe(false);
  notify({ uid: "a", email: null });
  session.clearData();
  profile.resolve({ id: "a", name: "old private name" });
  await Promise.resolve();
  await Promise.resolve();
  expect(session.snapshot().profile).toBeNull();
  expect(session.snapshot().data).toEqual({});
});
it("latest query wins and filters cross-account documents from a bad boundary", async () => {
  const first = deferred<unknown[]>(),
    second = deferred<unknown[]>();
  const list = vi
    .fn()
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);
  const session = new Session({
    observe: (cb: Parameters<Backend["observe"]>[0]) => {
      cb({ uid: "a", email: null });
      return () => {};
    },
    profile: async () => null,
    list,
  } as unknown as Backend);
  session.start();
  const one = session.load("moods"),
    two = session.load("moods");
  second.resolve([
    { id: "latest", userId: "a" },
    { id: "other-secret", userId: "b" },
  ]);
  await two;
  first.resolve([{ id: "older", userId: "a" }]);
  await one;
  expect(session.snapshot().data.moods?.items.map((x) => x.id)).toEqual([
    "latest",
  ]);
});
it("does not start queries or accept profile refreshes while offline", async () => {
  const list = vi.fn(async () => []),
    profile = vi.fn(async () => ({ id: "a", name: "Private name" }));
  const session = new Session({
    observe: (cb: Parameters<Backend["observe"]>[0]) => {
      cb({ uid: "a", email: null });
      return () => {};
    },
    list,
    profile,
  } as unknown as Backend);
  session.start();
  session.setOnline(false);
  await session.load("moods");
  await session.refreshProfile();
  expect(list).not.toHaveBeenCalled();
  expect(session.snapshot().profile).toBeNull();
  session.setOnline(true);
  await session.load("moods");
  expect(list).toHaveBeenCalledTimes(1);
});
it("reports a query error without logging private messages and supports retry", async () => {
  const list = vi
    .fn()
    .mockRejectedValueOnce(new Error("private content"))
    .mockResolvedValueOnce([]);
  const session = new Session({
    observe: (cb: Parameters<Backend["observe"]>[0]) => {
      cb({ uid: "a", email: null });
      return () => {};
    },
    profile: async () => null,
    list,
  } as unknown as Backend);
  session.start();
  await session.load("journals");
  expect(session.snapshot().data.journals?.error).not.toContain(
    "private content",
  );
  await session.load("journals");
  expect(session.snapshot().data.journals?.error).toBeUndefined();
});
