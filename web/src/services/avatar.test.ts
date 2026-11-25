import { expect, it } from "vitest";
import { ownedAvatarPath, legacyAvatarPath, validAvatar, MAX_AVATAR_BYTES } from "./avatar";
const bucket = "demo-ruangjiwa.appspot.com";
it("only converts configured-bucket owner legacy URLs to paths", () => {
  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/profile_images%2Fa%2Favatar.png?alt=media&token=old`;
  expect(legacyAvatarPath("a", url, bucket)).toBe("profile_images/a/avatar.png");
  for (const bad of [url.replace(bucket, "other.appspot.com"), url.replace("%2Fa%2F", "%2Fb%2F"), url.replace("avatar.png", "..%2Favatar.png"), url.replace("avatar.png", "%252e%252e"), url.replace("firebasestorage.googleapis.com", "evil.test"), "blob:https://example.test/a", "https://evil.test/photo", url.replace("avatar.png", "%zz")])
    expect(legacyAvatarPath("a", bad, bucket)).toBeUndefined();
  expect(legacyAvatarPath("a", url.replace("https://firebasestorage.googleapis.com", "http://127.0.0.1:9199"), bucket)).toBeUndefined();
  expect(legacyAvatarPath("a", url.replace("https://firebasestorage.googleapis.com", "http://127.0.0.1:9199"), bucket, true)).toBe("profile_images/a/avatar.png");
});
it("validates owner prefix, single conservative filename and 2048-byte field boundary", () => {
  const prefix = "profile_images/a/";
  expect(ownedAvatarPath("a", prefix + "x".repeat(2048 - prefix.length))).toHaveLength(2048);
  for (const path of [prefix + "x".repeat(2049 - prefix.length), "profile_images/b/x", prefix, prefix + "../x", prefix + "%2f", prefix + ".", prefix + "nested/x", prefix + "x?token=a", "https://evil.test/x", prefix + "a\\b", prefix + "x y", null])
    expect(ownedAvatarPath("a", path)).toBeUndefined();
});
it("limits uploaded and read blobs to supported MIME and nonempty bytes at exactly 5 MiB", () => {
  for (const type of ["image/jpeg", "image/png", "image/webp"])
    expect(validAvatar({ type, size: MAX_AVATAR_BYTES })).toBe(true);
  for (const photo of [{ type: "image/svg+xml", size: 1 }, { type: "image/png", size: 0 }, { type: "image/png", size: MAX_AVATAR_BYTES + 1 }]) expect(validAvatar(photo)).toBe(false);
});
