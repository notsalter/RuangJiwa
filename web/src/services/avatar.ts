export class AvatarSaveError extends Error {
  constructor(cause: unknown) {
    super("Foto/profil mungkin tersimpan sebagian. Belum terverifikasi; muat ulang dan coba simpan lagi.", {cause});
  }
}
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export function validAvatar(photo: { type: string; size: number }): boolean {
  return ["image/jpeg", "image/png", "image/webp"].includes(photo.type)
    && photo.size > 0 && photo.size <= MAX_AVATAR_BYTES;
}
export function legacyAvatarPath(uid: string, value: unknown, bucket: string, emulator = false): string | undefined {
  if (typeof value !== "string" || value.length > 2048) return;
  try {
    const url = new URL(value);
    if (url.username || url.password || url.hash) return;
    if (url.origin !== "https://firebasestorage.googleapis.com"
      && !(emulator && url.origin === "http://127.0.0.1:9199")) return;
    const prefix = `/v0/b/${bucket}/o/`;
    if (!url.pathname.startsWith(prefix)) return;
    return ownedAvatarPath(uid, decodeURIComponent(url.pathname.slice(prefix.length)));
  } catch { return; }
}
export function ownedAvatarPath(uid: string, value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 2048) return;
  const prefix = `profile_images/${uid}/`;
  if (!value.startsWith(prefix) || !/^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/.test(value.slice(prefix.length))) return;
  return value;
}
