import { afterEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/preact";
import { createHttpBackend, SESSION_VERSION_EVENT } from "./backend-http";
import { createBackend as createSelectedBackend } from "./firebase";
import { Session } from "../core/session";
import { useAvatar } from "../ui/avatar";
import type { Backend, User } from "../core/types";

const env = { VITE_API_URL: "https://api.example.test", VITE_BACKEND: "http" };
const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" }, ...init });
const session = { session: { id: "s1" }, user: { id: "u1", email: "u@example.test", name: "U" } };

afterEach(() => vi.restoreAllMocks());

describe("HTTP backend", () => {
  it("always uses cookie credentials and never writes tokens to storage", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(json(session));
    const backend = createHttpBackend(env)!;
    const stop = backend.observe(() => {}, () => {});
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ credentials: "include" });
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    stop();
  });

  it("turns an unauthorized protected request into permission-denied", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(json({ error: "unauthorized" }, { status: 401 }));
    await expect(createHttpBackend(env)!.profile("u1")).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("clears observed account state when the session changes", async () => {
    const callbacks: Array<User | null> = [];
    let current = session;
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => json(current));
    const backend = createHttpBackend(env)!;
    const stop = backend.observe((user) => callbacks.push(user), () => {});
    await vi.waitFor(() => expect(callbacks).toHaveLength(1));
    current = { ...session, user: { id: "u2", email: "two@example.test", name: "Two" } };
    window.dispatchEvent(new Event(SESSION_VERSION_EVENT));
    await vi.waitFor(() => expect(callbacks).toHaveLength(2));
    expect(callbacks[1]).toMatchObject({ uid: "u2", email: "two@example.test" });
    stop();
  });

  it("maps validation failures to the existing record error code", async () => {
    const validMood = {
      mood: "happy",
      createdAt: new Date().toISOString(),
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(json({ code: "validation", message: "bad" }, { status: 422 }));
    await expect(createHttpBackend(env)!.create("moods", "u1", validMood)).rejects.toMatchObject({ code: "invalid-record-schema" });
  });

  it("uploads avatars as multipart and reads them as authenticated blobs", async () => {
    const blob = new Blob(["image"], { type: "image/png" });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/api/profile") && init?.method === "PATCH") return json({ name: "New", email: "u@example.test", avatarPath: "avatar.png" });
      if (url.endsWith("/api/profile/avatar")) {
        expect(init?.body).toBeInstanceOf(FormData);
        return json({ avatarPath: "avatar.png" });
      }
      if (url.endsWith("/api/profile")) return json({ name: "New", email: "u@example.test", avatarPath: "avatar.png" });
      return new Response(blob, { status: 200, headers: { "content-type": "image/png" } });
    });
    const backend = createHttpBackend(env)!;
    await backend.saveProfile("u1", "New", new File(["image"], "avatar.png", { type: "image/png" }));
    const read = await backend.getPhoto!("u1", "profile_images/u1/avatar.png");
    expect(read.type).toBe("image/png");
    expect(fetchMock.mock.calls.some(([input]) => String(input).endsWith("/api/avatar/avatar.png"))).toBe(true);
  });

  it("revokes object URLs through the avatar helper lifecycle", async () => {
    const created = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    const revoked = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const session = new Session({
      observe(callback: (user: User | null) => void) { callback({ uid: "u1", email: "u@example.test" }); return () => {}; },
      profile: async (uid: string) => ({ id: uid, profileImagePath: "profile_images/u1/avatar.png" }),
      getPhoto: async () => new Blob(["x"], { type: "image/png" }),
    } as unknown as Backend);
    session.start();
    function Avatar() {
      const avatar = useAvatar(session);
      return avatar.url ? <img alt="avatar" src={avatar.url} /> : null;
    }
    const view = render(<Avatar />);
    await waitFor(() => expect(created).toHaveBeenCalled());
    view.unmount();
    expect(revoked).toHaveBeenCalledWith("blob:test");
  });

  it("maps an unconfigured password reset endpoint to the stable reset error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(json({ error: "auth/reset-not-configured" }, { status: 501 }));
    await expect(createHttpBackend(env)!.resetPassword("u@example.test")).rejects.toMatchObject({ code: "auth/reset-not-configured" });
    expect(vi.mocked(globalThis.fetch).mock.calls[0][0]).toContain("/api/auth/request-password-reset");
  });

  it("uses HTTP only when explicitly selected with a valid API URL", () => {
    expect(createSelectedBackend(env)).not.toBeNull();
    expect(createSelectedBackend({ VITE_BACKEND: "http" })).toBeNull();
    expect(createSelectedBackend({ VITE_BACKEND: "http", VITE_API_URL: "http://evil.test" })).toBeNull();
  });
});
