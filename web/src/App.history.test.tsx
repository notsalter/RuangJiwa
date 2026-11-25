import { afterEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { App } from "./App";
import { Session } from "./core/session";
import type { Backend } from "./core/types";

afterEach(() => vi.restoreAllMocks());

async function start() {
  history.replaceState({ unrelated: "retained" }, "", "/");
  const session = new Session({
    observe: (cb: Parameters<Backend["observe"]>[0]) => {
      cb({ uid: "fixture", email: null });
      return () => {};
    },
    profile: async () => null,
    list: async () => [],
  } as unknown as Backend);
  render(<App session={session} />);
  await screen.findByRole("heading", { name: "Apa kabar hari ini?" });
}

async function tab(name: string, heading: string) {
  fireEvent.click(screen.getByRole("navigation").querySelector(`a[href="${name}"]`)!);
  await screen.findByRole("heading", { name: heading });
}

it("declining Back retains the Mood entry for Back after cancelling the draft", async () => {
  await start();
  await tab("/mood", "Catat mood");
  await tab("/journal", "Tulis jurnal");
  fireEvent.input(screen.getByLabelText("Isi jurnal"), {
    target: { value: "Draft that must remain" },
  });
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  history.back();
  await waitFor(() => expect(confirm).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(location.pathname).toBe("/journal"));
  expect((screen.getByLabelText("Isi jurnal") as HTMLTextAreaElement).value).toBe(
    "Draft that must remain",
  );
  fireEvent.click(screen.getByRole("button", { name: "Batalkan jurnal" }));
  history.back();
  await waitFor(() => expect(location.pathname).toBe("/mood"));
  await screen.findByRole("heading", { name: "Catat mood" });
});

it("repeated declined traversals preserve Back, Forward, multi-entry distance and unrelated state", async () => {
  await start();
  const rootState = history.state;
  await tab("/mood", "Catat mood");
  const moodState = history.state;
  await tab("/journal", "Tulis jurnal");
  await tab("/profile", "Profil saya");
  await tab("/consultations", "Konsultasi");
  history.go(-2);
  await screen.findByRole("heading", { name: "Tulis jurnal" });
  fireEvent.input(screen.getByLabelText("Isi jurnal"), {
    target: { value: "Preserved future draft" },
  });
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  const length = history.length;
  for (const [delta, calls] of [[-1, 1], [-1, 2], [-2, 3], [1, 4], [2, 5]]) {
    history.go(delta);
    await waitFor(() => expect(confirm).toHaveBeenCalledTimes(calls));
    await waitFor(() => expect(location.pathname).toBe("/journal"));
  }
  expect(history.length).toBe(length);
  expect((screen.getByLabelText("Isi jurnal") as HTMLTextAreaElement).value).toBe("Preserved future draft");
  confirm.mockReturnValue(true);
  history.forward();
  await screen.findByRole("heading", { name: "Profil saya" });
  expect(confirm).toHaveBeenCalledTimes(6);
  history.forward();
  await screen.findByRole("heading", { name: /^Konsultasi$/ });
  history.go(-3);
  await screen.findByRole("heading", { name: "Catat mood" });
  expect(history.state).toEqual(moodState);
  history.back();
  await screen.findByRole("heading", { name: "Apa kabar hari ini?" });
  expect(history.state).toEqual(rootState);
  expect(history.state.unrelated).toBe("retained");
});

it("keeps an unindexed entry untouched and retains the editor when pre-traversal cancellation is unavailable", async () => {
  await start();
  await tab("/journal", "Tulis jurnal");
  fireEvent.input(screen.getByLabelText("Isi jurnal"), {
    target: { value: "Boundary draft" },
  });
  history.pushState({ foreign: "retained" }, "", "/mood");
  window.dispatchEvent(new PopStateEvent("popstate", { state: history.state }));
  expect(history.state).toEqual({ foreign: "retained" });
  expect(location.pathname).toBe("/mood");
  expect((screen.getByLabelText("Isi jurnal") as HTMLTextAreaElement).value).toBe("Boundary draft");
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", expect.stringContaining("Riwayat browser"));
  const reload = screen.getByRole("link", { name: "Muat halaman tujuan" });
  expect(reload.hasAttribute("data-native")).toBe(true);
  expect(reload.getAttribute("href")).toBe("/mood");
  fireEvent.click(screen.getByRole("button", { name: "Batalkan jurnal" }));
  await screen.findByRole("heading", { name: "Catat mood" });
});

it("declining an unindexed native traversal does not overwrite its URL or state", async () => {
  const navigation = new EventTarget();
  const previousNavigation = Object.getOwnPropertyDescriptor(window, "navigation");
  Object.defineProperty(window, "navigation", { configurable: true, value: navigation });
  await start();
  // An unrelated script created this entry before App-owned routing began.
  const homeState = history.state;
  history.pushState({ foreign: "keep" }, "", "/mood");
  window.dispatchEvent(new PopStateEvent("popstate", { state: history.state }));
  await screen.findByRole("heading", { name: "Catat mood" });
  await tab("/journal", "Tulis jurnal");
  fireEvent.input(screen.getByLabelText("Isi jurnal"), {
    target: { value: "Keep unindexed draft" },
  });
  vi.spyOn(window, "confirm").mockReturnValue(false);
  // Navigation API fires before traversal; unlike popstate it is cancellable.
  const event = new Event("navigate", { cancelable: true });
  Object.assign(event, {
    navigationType: "traverse",
    destination: { sameDocument: true, url: location.origin + "/mood", getState: () => ({ foreign: "keep" }) },
  });
  navigation.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  expect(location.pathname).toBe("/journal");
  expect(homeState.unrelated).toBe("retained");
  if (previousNavigation) Object.defineProperty(window, "navigation", previousNavigation);
  else Reflect.deleteProperty(window, "navigation");
});
