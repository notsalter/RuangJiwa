import { it, expect } from "vitest";
import { profileValidation } from "./profile";
it("requires a nonempty bounded display name and allows only small non-SVG photos", () => {
  expect(profileValidation("  ")).toContain("Nama");
  expect(profileValidation("a".repeat(101))).toContain("100");
  expect(
    profileValidation(
      "Nama",
      new File(["x"], "x.svg", { type: "image/svg+xml" }),
    ),
  ).toContain("JPEG");
  expect(
    profileValidation(
      "Nama",
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], "x.jpg", {
        type: "image/jpeg",
      }),
    ),
  ).toContain("5 MB");
  expect(
    profileValidation(
      " Nama ",
      new File(["x"], "x.png", { type: "image/png" }),
    ),
  ).toBe("");
});
