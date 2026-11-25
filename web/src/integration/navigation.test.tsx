import { afterEach, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/preact";
import { App } from "../App";
import { Session } from "../core/session";
import type { Backend } from "../core/types";

afterEach(() => vi.unstubAllEnvs());
function session() {
  return new Session({
    observe: (cb: Parameters<Backend["observe"]>[0]) => {
      cb({ uid: "a", email: null });
      return () => {};
    },
    profile: async () => null,
    list: async () => [],
  } as unknown as Backend);
}
it.each(["/", "/RuangJiwa/", "/team/RuangJiwa/"])(
  "routes every feature and marks active navigation relative to %s",
  async (base) => {
    vi.stubEnv("BASE_URL", base);
    window.history.replaceState({}, "", base);
    render(<App session={session()} />);
    await screen.findByRole("heading", { name: "Apa kabar hari ini?" });
    for (const [label, path] of [
      ["Catat mood", "mood"],
      ["Tulis jurnal", "journal"],
      ["Lihat psikolog", "consultations"],
    ]) {
      expect(
        screen.getByRole("link", { name: label }).getAttribute("href"),
      ).toBe(base + path);
    }
    const nav = within(screen.getByRole("navigation"));
    for (const [label, path, heading] of [
      ["Mood", "mood", "Catat mood"],
      ["Jurnal", "journal", "Tulis jurnal"],
      ["Konsultasi", "consultations", "Konsultasi"],
      ["Profil", "profile", "Profil saya"],
      ["Beranda", "", "Apa kabar hari ini?"],
    ]) {
      const link = nav.getByRole("link", { name: label });
      expect(link.getAttribute("href")).toBe(base + path);
      fireEvent.click(link);
      await screen.findByRole("heading", { name: heading, level: 1 });
      expect(link.getAttribute("aria-current")).toBe("page");
      expect(location.pathname).toBe(base + path);
      expect(document.activeElement?.id).toBe("content");
    }
    fireEvent.click(nav.getByRole("link", { name: "Konsultasi" }));
    const quiz = await screen.findByRole("link", { name: "Isi kuis refleksi" });
    expect(quiz.getAttribute("href")).toBe(base + "quiz");
    fireEvent.click(quiz);
    await screen.findByRole("heading", { name: "Kuis refleksi" });
    expect(
      nav
        .getByRole("link", { name: "Konsultasi" })
        .getAttribute("aria-current"),
    ).toBe("page");
    for (const link of document.querySelectorAll('a[href^="/"]'))
      expect(link.getAttribute("href")?.startsWith(base)).toBe(true);
  },
);
it("handles unknown, malformed and outside-base paths without a router decoding crash", async () => {
  vi.stubEnv("BASE_URL", "/RuangJiwa/");
  window.history.replaceState({}, "", "/RuangJiwa/unknown");
  render(<App session={session()} />);
  await screen.findByRole("heading", { name: "Halaman tidak ditemukan" });
  expect(
    screen
      .getByRole("link", { name: "Kembali ke beranda" })
      .getAttribute("href"),
  ).toBe("/RuangJiwa/");
  for (const path of [
    "/RuangJiwa/%invalid",
    "/RuangJiwa//journal",
    "/RuangJiwaOther/journal",
    "/journal",
  ]) {
    window.history.replaceState({}, "", path);
    fireEvent(window, new PopStateEvent("popstate"));
    await screen.findByRole("heading", { name: "Halaman tidak ditemukan" });
    expect(document.querySelector('[aria-current="page"]')).toBeNull();
  }
  window.history.replaceState({}, "", "/RuangJiwa/journal/?x=%broken#form");
  fireEvent(window, new PopStateEvent("popstate"));
  await screen.findByRole("heading", { name: "Tulis jurnal" });
  await waitFor(() =>
    expect(
      screen.getByRole("link", { name: "Jurnal" }).getAttribute("aria-current"),
    ).toBe("page"),
  );
});
