import { it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/preact";
import { App } from "./App";
import { Session } from "./core/session";
import type { Backend, User } from "./core/types";
it("shows an honest usable configuration screen without environment", () => {
  render(<App session={new Session(null)} />);
  expect(screen.getByText(/Konfigurasi Firebase diperlukan/)).toBeTruthy();
  expect(screen.getByLabelText("Email")).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Masuk" }).hasAttribute("disabled"),
  ).toBe(true);
});
it("registers with native labels, displays errors safely, then routes signed-in home and logout", async () => {
  let notify!: (u: User | null) => void;
  const login = vi.fn(async () => {
    throw new Error("sensitive");
  });
  const session = new Session({
    observe: (cb: (u: User | null) => void) => {
      notify = cb;
      cb(null);
      return () => {};
    },
    login,
    profile: async () => ({ id: "a", name: "Nama Saya" }),
    list: async () => [],
    logout: async () => {},
  } as unknown as Backend);
  render(<App session={session} />);
  fireEvent.click(screen.getByRole("button", { name: "Buat akun" }));
  fireEvent.input(screen.getByLabelText("Email"), {
    target: { value: "test@example.test" },
  });
  fireEvent.input(screen.getByLabelText("Kata sandi"), {
    target: { value: "long-password" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Daftar" }).closest("form")!,
  );
  await waitFor(() =>
    expect(login).toHaveBeenCalledWith(
      "test@example.test",
      "long-password",
      true,
    ),
  );
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.queryByText("sensitive")).toBeNull();
  notify({ uid: "a", email: "test@example.test" });
  expect(await screen.findByText(/Nama Saya/)).toBeTruthy();
  expect(
    screen.getByRole("heading", { name: "Apa kabar hari ini?" }),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Keluar" }));
  expect(await screen.findByRole("button", { name: "Masuk" })).toBeTruthy();
});
