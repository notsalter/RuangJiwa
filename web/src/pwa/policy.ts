const blockedSegments = new Set([
  'api', '__', 'auth', 'oauth', 'session', 'sessions', 'data', 'emulator', 'emulators',
  'v1', 'v2', 'identitytoolkit.googleapis.com', 'securetoken.googleapis.com',
]);

export function isShellAssetPath(path: string): boolean {
  return /^(?:index\.html|manifest\.webmanifest|favicon\.svg|icons\/(?:icon-192|icon-512|icon-512-maskable|apple-touch-icon)\.png|assets\/[^/]+\.(?:js|css))$/.test(path);
}

export function isShellRequest(request: Pick<Request, 'url' | 'method' | 'headers'>, scope: string): boolean {
  const url = new URL(request.url);
  const base = new URL(scope);
  if (request.method !== 'GET' || url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return false;
  if (url.search || url.hash || request.headers.has('authorization') || request.headers.has('range')) return false;
  let path: string;
  try { path = decodeURIComponent(url.pathname.slice(base.pathname.length)); } catch { return false; }
  if (path.includes('\\') || path.includes('%')) return false;
  return !path.toLowerCase().split('/').some((segment) => blockedSegments.has(segment));
}

export function isShellNavigation(path: string): boolean {
  return path === 'index.html' || path.split('/').every((part) => part === '' || /^[A-Za-z0-9_-]+$/.test(part));
}
