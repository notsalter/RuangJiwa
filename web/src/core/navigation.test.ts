import { expect, it } from "vitest";
import { appHref, relativePath } from "./navigation";

it("rejects traversal, external paths, prefix collisions and malformed route paths without interpreting them", () => {
  for (const path of [
    "//evil.test/",
    "https://evil.test",
    "/../mood",
    "/a/./b",
    "/a//b",
    "/%2e%2e/mood",
    "/a\\b",
    "/mood?x=1",
    "/mood#x",
    "journal",
  ]) {
    expect(() => appHref(path, "/RuangJiwa/")).toThrow(/path/i);
  }
  for (const path of [
    "/journal",
    "/RuangJiwaOther/journal",
    "/RuangJiwa/../journal",
    "/RuangJiwa/%2e%2e/journal",
    "/RuangJiwa//journal",
    "/RuangJiwa/%broken",
    "//evil.test/RuangJiwa/",
  ]) {
    expect(relativePath(path, "/RuangJiwa/")).toBeNull();
  }
  expect(() => appHref("/journal", "/a/../b/")).toThrow(/VITE_BASE_PATH/);
  expect(relativePath("/RuangJiwa/unknown", "/RuangJiwa/")).toBe("/unknown");
});

it("aligns feature hrefs and route identities under root or a validated deployment base", () => {
  expect(appHref("/", "/")).toBe("/");
  expect(appHref("/journal", "/")).toBe("/journal");
  expect(appHref("/", "/RuangJiwa/")).toBe("/RuangJiwa/");
  expect(appHref("/journal", "/team/RuangJiwa")).toBe(
    "/team/RuangJiwa/journal",
  );
  expect(relativePath("/RuangJiwa/journal?view=1#form", "/RuangJiwa/")).toBe(
    "/journal",
  );
  expect(relativePath("/RuangJiwa/", "/RuangJiwa/")).toBe("/");
  expect(relativePath("/RuangJiwa", "/RuangJiwa/")).toBe("/");
  expect(relativePath("/mood?x=%invalid", "/")).toBe("/mood");
  expect(relativePath("/RuangJiwa/journal/", "/RuangJiwa/")).toBe("/journal");
});
