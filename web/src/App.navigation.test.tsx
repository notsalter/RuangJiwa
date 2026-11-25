import { it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/preact";
import { App } from "./App";
import { Session } from "./core/session";
import type { Backend } from "./core/types";
it("routes every visible tab and quiz to built screens and waits for initial auth", async () => {
  let auth!: Parameters<Backend["observe"]>[0];
  const session = new Session({
    observe: (cb: typeof auth) => {
      auth = cb;
      return () => {};
    },
    profile: async () => null,
    list: async () => [],
  } as unknown as Backend);
  render(<App session={session} />);
  expect(screen.getByRole("status").textContent).toContain("Memeriksa");
  expect(screen.queryByRole("button", { name: "Masuk" })).toBeNull();
  auth({ uid: "a", email: null });
  await screen.findByRole("navigation");
  for (const [tab, heading] of [
    ["Mood", "Catat mood"],
    ["Jurnal", "Tulis jurnal"],
    ["Konsultasi", "Konsultasi"],
    ["Profil", "Profil saya"],
    ["Beranda", "Apa kabar hari ini?"],
  ]) {
    fireEvent.click(screen.getByRole("link", { name: tab }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
        heading,
      ),
    );
  }
  fireEvent.click(screen.getByRole("link", { name: "Konsultasi" }));
  fireEvent.click(
    await screen.findByRole("link", { name: "Isi kuis refleksi" }),
  );
  await screen.findByRole("heading", { name: "Kuis refleksi" });
});
