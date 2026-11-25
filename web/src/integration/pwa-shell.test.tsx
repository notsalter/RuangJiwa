import { afterEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { App } from "../App";
import { Session } from "../core/session";
import type { Backend, User } from "../core/types";

afterEach(() => vi.unstubAllGlobals());

it("captures installation during auth loading and keeps one controls instance across auth, routes and offline", async () => {
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }));
  let notify!: (user: User | null) => void;
  const session = new Session({
    observe: (cb: typeof notify) => {
      notify = cb;
      return () => {};
    },
    profile: async () => null,
    list: async () => [],
  } as unknown as Backend);
  render(<App session={session} />);
  expect(screen.getByText("Memeriksa sesi...")).toBeTruthy();
  const controls = screen.getByRole("complementary", {
    name: "Pemasangan dan pembaruan RuangJiwa",
  });
  const prompt = vi.fn(async () => {});
  const event = Object.assign(
    new Event("beforeinstallprompt", { cancelable: true }),
    {
      prompt,
      userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
    },
  );
  fireEvent(window, event);
  expect(event.defaultPrevented).toBe(true);
  notify(null);
  await screen.findByRole("button", { name: "Masuk" });
  notify({ uid: "a", email: null });
  fireEvent.click(await screen.findByRole("link", { name: "Jurnal" }));
  await screen.findByRole("heading", { name: "Tulis jurnal" });
  fireEvent.click(screen.getByRole("button", { name: "Pasang RuangJiwa" }));
  await waitFor(() => expect(prompt).toHaveBeenCalledTimes(1));
  expect(screen.getByRole("complementary")).toBe(controls);
  expect(screen.queryByText("RuangJiwa dibuka sebagai aplikasi.")).toBeNull();
  fireEvent(window, new Event("appinstalled"));
  await screen.findByText("RuangJiwa dibuka sebagai aplikasi.");
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: false,
  });
  fireEvent(window, new Event("offline"));
  await screen.findByRole("heading", { name: "Kamu sedang offline" });
  expect(screen.getAllByRole("complementary")).toEqual([controls]);
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: true,
  });
});
