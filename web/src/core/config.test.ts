import { describe, it, expect } from "vitest";
import { firebaseConfig, safePhotoUrl, safeError } from "./config";
describe("configuration boundary", () => {
  it("returns no configuration for absent or partial environment", () => {
    expect(firebaseConfig({})).toBeNull();
    expect(firebaseConfig({ VITE_FIREBASE_API_KEY: "identifier" })).toBeNull();
  });
  it("accepts only HTTPS photos without embedded credentials", () => {
    expect(safePhotoUrl("javascript:alert(1)")).toBeUndefined();
    expect(safePhotoUrl("https://user:pass@example.com/x")).toBeUndefined();
    expect(safePhotoUrl("https://example.com/photo")).toBe(
      "https://example.com/photo",
    );
    expect(safePhotoUrl("http://127.0.0.1:9199/photo")).toBeUndefined();
    expect(safePhotoUrl("http://127.0.0.1:9199/photo", true)).toBe(
      "http://127.0.0.1:9199/photo",
    );
    expect(safePhotoUrl("http://example.com/photo", true)).toBeUndefined();
  });
  it("does not surface backend messages or account existence", () => {
    expect(
      safeError({ code: "auth/user-not-found", message: "sensitive email" }),
    ).toBe(safeError({ code: "auth/wrong-password" }));
    expect(safeError(new Error("secret"))).not.toContain("secret");
    expect(safeError(new Error("secret"))).toContain("Coba");
  });
});
