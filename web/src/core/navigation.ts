import { normalizeBasePath } from "../pwa/deployment";

const safePath = /^\/(?:[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\/?|)$/;

export function appHref(path: string, base = import.meta.env.BASE_URL): string {
  if (!safePath.test(path)) throw new Error("Invalid application path");
  return normalizeBasePath(base) + path.slice(1);
}

export function relativePath(
  url: string,
  base = import.meta.env.BASE_URL,
): string | null {
  const root = normalizeBasePath(base);
  const path = url.split(/[?#]/, 1)[0];
  if (!safePath.test(path)) return null;
  if (path === root.slice(0, -1)) return "/";
  if (!path.startsWith(root)) return null;
  const relative = "/" + path.slice(root.length);
  return relative.length > 1 ? relative.replace(/\/$/, "") : relative;
}
