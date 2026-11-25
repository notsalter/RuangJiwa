import { afterEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { App } from "../App";
import { Session } from "../core/session";
import type { Backend } from "../core/types";

afterEach(() => {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: true,
  });
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  delete (navigator as unknown as { serviceWorker?: unknown }).serviceWorker;
});
function setup() {
  vi.stubEnv("PROD", true);
  const postMessage = vi.fn();
  const worker = Object.assign(new EventTarget(), {
    state: "installed",
    postMessage,
  });
  const registration = Object.assign(new EventTarget(), {
    waiting: worker,
    active: worker,
    installing: null,
  });
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { register: vi.fn(async () => registration) },
  });
  const session = new Session({
    observe: (cb: Parameters<Backend["observe"]>[0]) => {
      cb({ uid: "a", email: null });
      return () => {};
    },
    profile: async () => null,
    list: async () => [],
    create: async () => {},
    logout: async () => {},
  } as unknown as Backend);
  const view = render(<App session={session} />);
  return { session, postMessage, ...view };
}
it("asks before routing away or logging out, preserving the actual draft when rejected and clearing after consent", async () => {
  history.replaceState({ unrelated: "retained" }, "", "/");
  const { session, postMessage } = setup();
  const logout = vi.spyOn(session, "logout");
  await screen.findByRole("heading", { name: "Apa kabar hari ini?" });
  const homeState = history.state;
  fireEvent.click(screen.getByRole("link", { name: "Mood" }));
  await screen.findByRole("heading", { name: "Catat mood" });
  const moodState = history.state;
  fireEvent.click(screen.getByRole("link", { name: "Jurnal" }));
  await screen.findByRole("heading", { name: "Tulis jurnal" });
  const journalState = history.state;
  fireEvent.click(screen.getByRole("link", { name: "Profil" }));
  await screen.findByRole("heading", { name: "Profil saya" });
  const profileState = history.state;
  history.back();
  await screen.findByRole("heading", { name: "Tulis jurnal" });
  const length = history.length;
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  const update = await screen.findByRole("button", {
    name: "Perbarui dan muat ulang",
  });
  fireEvent.input(screen.getByLabelText("Isi jurnal"), {
    target: { value: "Draft yang belum tersimpan" },
  });
  const expectProtectedDraft = () => {
    expect(location.pathname).toBe("/journal");
    expect(history.state).toEqual(journalState);
    expect(history.length).toBe(length);
    expect(
      (screen.getByLabelText("Isi jurnal") as HTMLTextAreaElement).value,
    ).toBe("Draft yang belum tersimpan");
    expect(update.hasAttribute("disabled")).toBe(true);
    fireEvent.click(update);
    expect(postMessage).not.toHaveBeenCalled();
  };
  fireEvent.click(screen.getByRole("link", { name: "Mood" }));
  expect(confirm).toHaveBeenCalledTimes(1);
  expectProtectedDraft();
  history.back();
  await waitFor(() => expect(confirm).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(location.pathname).toBe("/journal"));
  expectProtectedDraft();
  fireEvent.click(screen.getByRole("button", { name: "Keluar" }));
  expect(confirm).toHaveBeenCalledTimes(3);
  expect(logout).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "Masuk" })).toBeNull();
  expectProtectedDraft();
  confirm.mockReturnValue(true);
  history.back();
  await waitFor(() => expect(location.pathname).toBe("/mood"));
  await screen.findByRole("heading", { name: "Catat mood" });
  expect(confirm).toHaveBeenCalledTimes(4);
  expect(history.state).toEqual(moodState);
  expect(update.hasAttribute("disabled")).toBe(false);
  history.forward();
  await screen.findByRole("heading", { name: "Tulis jurnal" });
  expect(history.state).toEqual(journalState);
  expect((screen.getByLabelText("Isi jurnal") as HTMLTextAreaElement).value).toBe("");
  history.forward();
  await screen.findByRole("heading", { name: "Profil saya" });
  expect(history.state).toEqual(profileState);
  history.go(-3);
  await screen.findByRole("heading", { name: "Apa kabar hari ini?" });
  expect(history.state).toEqual(homeState);
  expect(history.state.unrelated).toBe("retained");
  expect(history.length).toBe(length);
  history.go(2);
  await screen.findByRole("heading", { name: "Tulis jurnal" });
  fireEvent.input(screen.getByLabelText("Isi jurnal"), {
    target: { value: "Draft sebelum pindah halaman" },
  });
  fireEvent.click(screen.getByRole("link", { name: "Mood" }));
  await screen.findByRole("heading", { name: "Catat mood" });
  expect(confirm).toHaveBeenCalledTimes(5);
  expect(update.hasAttribute("disabled")).toBe(false);
  fireEvent.click(screen.getByRole("link", { name: "Jurnal" }));
  await screen.findByRole("heading", { name: "Tulis jurnal" });
  expect((screen.getByLabelText("Isi jurnal") as HTMLTextAreaElement).value).toBe("");
  fireEvent.input(screen.getByLabelText("Isi jurnal"), {
    target: { value: "Draft sebelum keluar" },
  });
  expect(update.hasAttribute("disabled")).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Keluar" }));
  await screen.findByRole("button", { name: "Masuk" });
  expect(confirm).toHaveBeenCalledTimes(6);
  expect(logout).toHaveBeenCalledTimes(1);
  expect(screen.queryByLabelText("Isi jurnal")).toBeNull();
  expect(update.hasAttribute("disabled")).toBe(false);
  expect(postMessage).not.toHaveBeenCalled();
});
it.each([false, true])(
  "keeps update protection after a failed save and clears it on explicit cancellation (edit=%s)",
  async (editing) => {
    const { session } = setup();
    const record = {
      id: "j",
      userId: "a",
      title: "Awal",
      content: "Jurnal awal cukup panjang",
      createdAt: "2026-01-01",
      isFavorite: false,
    };
    vi.spyOn(session.backend!, "list").mockResolvedValue([record]);
    vi.spyOn(session, "create").mockRejectedValue(
      new Error("permission-denied"),
    );
    vi.spyOn(session, "update").mockRejectedValue(
      new Error("permission-denied"),
    );
    fireEvent.click(await screen.findByRole("link", { name: "Jurnal" }));
    const update = await screen.findByRole("button", {
      name: "Perbarui dan muat ulang",
    });
    if (editing) {
      fireEvent.click(await screen.findByRole("button", { name: "Baca Awal" }));
      fireEvent.click(screen.getByRole("button", { name: "Edit jurnal" }));
      expect(update.hasAttribute("disabled")).toBe(false);
    }
    fireEvent.input(screen.getByLabelText("Isi jurnal"), {
      target: { value: "Draft yang gagal disimpan" },
    });
    fireEvent.submit(
      screen
        .getByRole("button", {
          name: editing ? "Simpan perubahan" : "Simpan jurnal",
        })
        .closest("form")!,
    );
    await screen.findByRole("alert");
    expect(update.hasAttribute("disabled")).toBe(true);
    fireEvent.click(
      screen.getByRole("button", {
        name: editing ? "Batal edit" : "Batalkan jurnal",
      }),
    );
    expect(update.hasAttribute("disabled")).toBe(false);
  },
);
it("reloads journal history after reconnect without replacing the unsaved draft", async () => {
  const { session } = setup();
  const list = vi.spyOn(session.backend!, "list").mockResolvedValue([]);
  fireEvent.click(await screen.findByRole("link", { name: "Jurnal" }));
  await screen.findByText("Belum ada jurnal. Tulis catatan pertamamu di atas.");
  fireEvent.input(screen.getByLabelText("Isi jurnal"), {
    target: { value: "Catatan yang belum tersimpan" },
  });
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: false,
  });
  fireEvent(window, new Event("offline"));
  await screen.findByRole("heading", { name: "Kamu sedang offline" });
  list.mockResolvedValue([
    {
      id: "j",
      userId: "a",
      title: "Dari server",
      content: "Catatan lama tetap ada",
      createdAt: "2026-01-01",
      isFavorite: false,
    },
  ]);
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: true,
  });
  fireEvent(window, new Event("online"));
  await screen.findByRole("button", { name: "Baca Dari server" });
  expect(
    (screen.getByLabelText("Isi jurnal") as HTMLTextAreaElement).value,
  ).toBe("Catatan yang belum tersimpan");
});
it("keeps an unsaved journal in memory through an offline transition and still blocks updates", async () => {
  setup();
  fireEvent.click(await screen.findByRole("link", { name: "Jurnal" }));
  fireEvent.input(screen.getByLabelText("Isi jurnal"), {
    target: { value: "Draft tanpa koneksi" },
  });
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: false,
  });
  fireEvent(window, new Event("offline"));
  await screen.findByRole("heading", { name: "Kamu sedang offline" });
  expect(
    screen
      .getByRole("button", { name: "Perbarui dan muat ulang" })
      .hasAttribute("disabled"),
  ).toBe(true);
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: true,
  });
  fireEvent(window, new Event("online"));
  await screen.findByRole("heading", { name: "Tulis jurnal" });
  expect(
    (screen.getByLabelText("Isi jurnal") as HTMLTextAreaElement).value,
  ).toBe("Draft tanpa koneksi");
});
it("blocks the real PWA update action while a journal is dirty and enables it only after saving", async () => {
  const { postMessage } = setup();
  fireEvent.click(await screen.findByRole("link", { name: "Jurnal" }));
  const update = await screen.findByRole("button", {
    name: "Perbarui dan muat ulang",
  });
  expect(update.hasAttribute("disabled")).toBe(false);
  fireEvent.input(screen.getByLabelText("Isi jurnal"), {
    target: { value: "Catatan yang perlu disimpan" },
  });
  await waitFor(() => expect(update.hasAttribute("disabled")).toBe(true));
  fireEvent.click(update);
  expect(postMessage).not.toHaveBeenCalled();
  fireEvent.submit(
    screen.getByRole("button", { name: "Simpan jurnal" }).closest("form")!,
  );
  await screen.findByText("Tersimpan.");
  expect(update.hasAttribute("disabled")).toBe(false);
  fireEvent.click(update);
  expect(postMessage).toHaveBeenCalledExactlyOnceWith({ type: "SKIP_WAITING" });
});
