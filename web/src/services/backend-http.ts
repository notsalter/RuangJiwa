import { AvatarSaveError, MAX_AVATAR_BYTES, validAvatar, ownedAvatarPath } from "./avatar";
import { decodeRecord } from "./records";
import { createRecord, updateRecord } from "./validation";
import type {
  Backend,
  Collection,
  Collections,
  Profile,
  User,
} from "../core/types";

/** Emitted after auth mutations; no push channel is assumed by this adapter. */
export const SESSION_VERSION_EVENT = "ruangjiwa:session-version";
const AUTH_PATH = "/api/auth";
const JSON_HEADERS = { Accept: "application/json" };

type HttpError = Error & { code: string; status?: number };
type SessionResponse = {
  user?: { id?: unknown; email?: unknown; name?: unknown; image?: unknown } | null;
};

function errorWithCode(code: string, message = code, status?: number): HttpError {
  const error = new Error(message) as HttpError;
  error.code = code;
  if (status !== undefined) error.status = status;
  return error;
}

function apiBase(env: Record<string, unknown>): string | null {
  if (env.VITE_BACKEND !== "http" || typeof env.VITE_API_URL !== "string") return null;
  const raw = env.VITE_API_URL.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname);
    if (url.username || url.password || (url.protocol !== "https:" && !(local && url.protocol === "http:"))) return null;
    return url.href.replace(/\/$/, "");
  } catch {
    return null;
  }
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw errorWithCode("invalid-record-schema");
  return value as Record<string, unknown>;
}

function sessionUser(payload: unknown): User | null {
  const root = asObject(payload) as SessionResponse;
  const source = root.user;
  if (!source) return null;
  if (typeof source.id !== "string" || typeof source.email !== "string")
    throw errorWithCode("invalid-session");
  return {
    uid: source.id,
    email: source.email,
    displayName: typeof source.name === "string" ? source.name : null,
    photoURL: typeof source.image === "string" ? source.image : null,
  };
}

const collectionPath = (name: Collection): string =>
  name === "quizHistory" ? "quiz-history" : name;
function pathPart(value: string): string {
  if (!value || value.length > 2048 || value.includes("/") || value.includes("\\") || value === "." || value === "..")
    throw errorWithCode("invalid-photo-path");
  return encodeURIComponent(value);
}

function profileValue(uid: string, payload: unknown): Profile {
  const data = asObject(payload);
  const avatar = typeof data.avatarPath === "string" && data.avatarPath
    ? ownedAvatarPath(uid, `profile_images/${uid}/${data.avatarPath}`)
    : undefined;
  return {
    id: uid,
    name: typeof data.name === "string" ? data.name : undefined,
    email: typeof data.email === "string" ? data.email : undefined,
    profileImagePath: avatar,
  };
}

function eventTarget(): EventTarget | null {
  return typeof window === "undefined" ? null : window;
}

/**
 * Cookie-session adapter for the self-hosted API.
 *
 * Session refresh is initial, on focus/visible transitions, and on
 * SESSION_VERSION_EVENT. The API currently has no push subscription, so a
 * background account change is observed on the next one of those triggers;
 * there is deliberately no tight polling loop.
 */
export function createHttpBackend(env: Record<string, unknown>): Backend | null {
  const base = apiBase(env);
  if (!base) return null;

  let epoch = 0;
  let observedUser: User | null = null;
  const pending = new Set<AbortController>();
  const stale = () => errorWithCode("session-changed");
  const invalidate = () => {
    epoch++;
    for (const controller of pending) controller.abort();
    pending.clear();
  };
  const notify = () => eventTarget()?.dispatchEvent(new Event(SESSION_VERSION_EVENT));

  async function request<T = unknown>(
    path: string,
    options: { method?: string; body?: unknown; form?: boolean; signal?: AbortSignal } = {},
    requestEpoch = epoch,
  ): Promise<T> {
    if (requestEpoch !== epoch) throw stale();
    const controller = new AbortController();
    const abort = () => controller.abort();
    options.signal?.addEventListener("abort", abort, { once: true });
    pending.add(controller);
    const headers: Record<string, string> = { ...JSON_HEADERS };
    let body: BodyInit | undefined;
    if (options.form) {
      body = options.body as FormData;
    } else if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }
    try {
      const response = await fetch(`${base}${path}`, {
        method: options.method ?? "GET",
        credentials: "include",
        headers,
        body,
        signal: controller.signal,
      });
      if (requestEpoch !== epoch) throw stale();
      let payload: unknown;
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("json")) {
        try { payload = await response.json(); } catch { payload = undefined; }
      } else if (response.ok) {
        return (await response.blob()) as T;
      }
      if (!response.ok) {
        const status = response.status;
        const auth = path.startsWith(AUTH_PATH);
        const bodyObject = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
        const apiCode = typeof bodyObject.code === "string" ? bodyObject.code : "";
        let code = status === 401 || status === 403 ? (auth ? "auth/invalid-credential" : "permission-denied") : "";
        if (status === 429) code = "auth/too-many-requests";
        else if (status === 409 && auth) code = "auth/email-already-in-use";
        else if (status === 422 || status === 400) code = "invalid-record-schema";
        else if (status === 501 && path === `${AUTH_PATH}/request-password-reset`) code = "auth/reset-not-configured";
        if (!code) code = apiCode || "request-failed";
        throw errorWithCode(code, typeof bodyObject.message === "string" ? bodyObject.message : code, status);
      }
      return payload as T;
    } catch (error) {
      if (requestEpoch !== epoch || (error instanceof DOMException && error.name === "AbortError")) throw stale();
      if (error instanceof TypeError) throw errorWithCode("network-error", error.message);
      throw error;
    } finally {
      pending.delete(controller);
      options.signal?.removeEventListener("abort", abort);
    }
  }

  function ensureOwner(uid: string) {
    if (observedUser && observedUser.uid !== uid) throw stale();
  }

  async function syncSession(callback: (user: User | null) => void, onError: (error: unknown) => void) {
    const requestEpoch = epoch;
    try {
      const user = sessionUser(await request(`${AUTH_PATH}/get-session`, {}, requestEpoch));
      if (requestEpoch !== epoch) return;
      if (observedUser?.uid !== user?.uid) invalidate();
      observedUser = user;
      callback(user);
    } catch (error) {
      if (requestEpoch !== epoch) return;
      if ((error as Partial<HttpError>).code === "permission-denied") {
        observedUser = null;
        callback(null);
      } else onError(error);
    }
  }

  const backend: Backend = {
    observe(callback, onError) {
      let active = true;
      const refresh = () => {
        if (active && (typeof document === "undefined" || document.visibilityState === "visible"))
          void syncSession(user => { if (active) callback(user); }, error => { if (active) onError(error); });
      };
      const visible = () => { if (document.visibilityState === "visible") refresh(); };
      const target = eventTarget();
      const doc = typeof document === "undefined" ? null : document;
      target?.addEventListener("focus", refresh);
      doc?.addEventListener("visibilitychange", visible);
      target?.addEventListener(SESSION_VERSION_EVENT, refresh);
      void syncSession(user => { if (active) callback(user); }, error => { if (active) onError(error); });
      return () => {
        active = false;
        target?.removeEventListener("focus", refresh);
        doc?.removeEventListener("visibilitychange", visible);
        target?.removeEventListener(SESSION_VERSION_EVENT, refresh);
        invalidate();
      };
    },
    async login(email, password, register) {
      const path = register ? `${AUTH_PATH}/sign-up/email` : `${AUTH_PATH}/sign-in/email`;
      await request(path, { method: "POST", body: { email, password, ...(register ? { name: email.split("@")[0] } : {}) } });
      notify();
    },
    async logout() {
      invalidate();
      try { await request(`${AUTH_PATH}/sign-out`, { method: "POST" }, epoch); }
      finally { observedUser = null; }
      notify();
    },
    async resetPassword(email) {
      await request(`${AUTH_PATH}/request-password-reset`, { method: "POST", body: { email } });
    },
    async profile(uid) {
      ensureOwner(uid);
      return profileValue(uid, await request("/api/profile"));
    },
    getPhoto: async (uid, path) => {
      ensureOwner(uid);
      const owned = ownedAvatarPath(uid, path);
      if (!owned) throw errorWithCode("invalid-photo-path");
      const response = await request<Blob>(`/api/avatar/${pathPart(owned.slice(`profile_images/${uid}/`.length))}`);
      if (typeof response?.size !== "number" || typeof response?.type !== "string" || typeof response?.arrayBuffer !== "function" || response.size > MAX_AVATAR_BYTES || !validAvatar({ type: response.type, size: response.size }))
        throw errorWithCode("invalid-photo");
      return response as Blob;
    },
    async saveProfile(uid, name, photo) {
      ensureOwner(uid);
      const displayName = name.trim();
      if (!displayName || displayName.length > 100) throw errorWithCode("invalid-name");
      if (photo && !validAvatar(photo)) throw errorWithCode("invalid-photo");
      let uploadStarted = false;
      try {
        if (photo) {
          const form = new FormData();
          form.append("avatar", photo);
          uploadStarted = true;
          await request("/api/profile/avatar", { method: "POST", body: form, form: true });
        }
        await request("/api/profile", { method: "PATCH", body: { name: displayName } });
      } catch (error) {
        if (photo && uploadStarted) throw new AvatarSaveError(error);
        throw error;
      }
    },
    async list(name, uid) {
      ensureOwner(uid);
      const route = collectionPath(name);
      const payload = await request<unknown>(`/api/${route}`);
      const items = Array.isArray(payload)
        ? payload
        : payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown }).items)
          ? (payload as { items: unknown[] }).items
          : null;
      if (!items) throw errorWithCode("invalid-record-schema");
      return items.map((item) => {
        const value = asObject(item);
        const id = typeof value.id === "string" ? value.id : "";
        const decoded = decodeRecord(name, id, value);
        if (!decoded) throw errorWithCode("invalid-record-schema");
        return decoded;
      }) as Collections[typeof name][];
    },
    async create(name, uid, data) {
      ensureOwner(uid);
      const payload = createRecord(name, uid, data);
      const { userId: _userId, ...requestBody } = payload;
      const route = collectionPath(name);
      await request(`/api/${route}`, { method: "POST", body: requestBody });
    },
    async update(name, uid, id, data) {
      ensureOwner(uid);
      const currentItems = await backend.list(name, uid);
      const current = currentItems.find(item => item.id === id);
      if (!current) throw errorWithCode("not-owner");
      updateRecord(name, uid, id, data, current as unknown as Record<string, unknown>);
      const body = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
      const route = collectionPath(name);
      await request(`/api/${route}/${encodeURIComponent(id)}`, { method: "PATCH", body });
    },
    async remove(name, uid, id) {
      ensureOwner(uid);
      if (name !== "journals") throw errorWithCode("invalid-record-schema");
      await request(`/api/journals/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  };
  return backend;
}

export function createBackend(env: Record<string, unknown>): Backend | null {
  return createHttpBackend(env);
}
