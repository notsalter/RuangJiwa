import { afterEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { JournalPage } from "../pages/Journal";
import { Session } from "../core/session";
import type { Backend } from "../core/types";

afterEach(() => vi.restoreAllMocks());
const entry = {
  id: "j",
  userId: "a",
  title: "Jurnal awal",
  content: "Isi jurnal awal cukup panjang",
  mood: "happy",
  prompt: "",
  tags: ["awal"],
  isFavorite: true,
  createdAt: "2026-01-01",
};
function journal() {
  const session = new Session({
    observe: (cb: Parameters<Backend["observe"]>[0]) => {
      cb({ uid: "a", email: null });
      return () => {};
    },
    profile: async () => null,
    list: async () => [entry],
    create: async () => {},
    update: async () => {},
  } as unknown as Backend);
  session.start();
  const dirty = vi.fn();
  const view = render(
    <JournalPage session={session} {...{ onDirtyChange: dirty }} />,
  );
  return { session, dirty, ...view };
}
it.each([
  [
    "Prompt refleksi",
    "change",
    "Apa tiga hal kecil yang membuatmu tersenyum hari ini? Jelaskan mengapa itu berarti.",
  ],
  ["Mood jurnal (opsional)", "change", "happy"],
  ["Tag (pisahkan dengan koma)", "input", "refleksi"],
])(
  "tracks %s independently of search/filter state",
  async (label, event, value) => {
    const { dirty } = journal();
    fireEvent.input(screen.getByLabelText("Cari jurnal"), {
      target: { value: "tidak cocok" },
    });
    fireEvent.click(screen.getByLabelText("Hanya favorit"));
    expect(dirty).toHaveBeenLastCalledWith(false);
    const control = screen.getByLabelText(label);
    if (event === "change") fireEvent.change(control, { target: { value } });
    else fireEvent.input(control, { target: { value } });
    expect(dirty).toHaveBeenLastCalledWith(true);
    fireEvent.click(screen.getByRole("button", { name: "Batalkan jurnal" }));
    expect(dirty).toHaveBeenLastCalledWith(false);
  },
);
it("requires consent before replacing a new draft with an existing journal and allows explicit cancellation", async () => {
  const { dirty } = journal();
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  fireEvent.input(screen.getByLabelText("Isi jurnal"), {
    target: { value: "Catatan baru belum disimpan" },
  });
  fireEvent.click(
    await screen.findByRole("button", { name: "Baca Jurnal awal" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Edit jurnal" }));
  expect(confirm).toHaveBeenCalledOnce();
  expect(
    (screen.getByLabelText("Isi jurnal") as HTMLTextAreaElement).value,
  ).toBe("Catatan baru belum disimpan");
  fireEvent.click(screen.getByRole("button", { name: "Batalkan jurnal" }));
  expect(dirty).toHaveBeenLastCalledWith(false);
  expect(unload()).toBe(false);
});
it("does not erase changes typed while an earlier journal save is pending", async () => {
  const { session, dirty } = journal();
  let finish!: (saved: boolean) => void;
  vi.spyOn(session, "create").mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  fireEvent.input(screen.getByLabelText("Isi jurnal"), {
    target: { value: "Catatan pertama cukup panjang" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Simpan jurnal" }).closest("form")!,
  );
  fireEvent.input(screen.getByLabelText("Isi jurnal"), {
    target: { value: "Catatan kedua belum tersimpan" },
  });
  finish(true);
  await screen.findByText("Tersimpan.");
  expect(
    (screen.getByLabelText("Isi jurnal") as HTMLTextAreaElement).value,
  ).toBe("Catatan kedua belum tersimpan");
  expect(dirty).toHaveBeenLastCalledWith(true);
});
it.each(["rejected", "stale"])(
  "keeps a %s save dirty with the actual content intact",
  async (outcome) => {
    const { session, dirty } = journal();
    vi.spyOn(session, "create").mockImplementation(async () => {
      if (outcome === "rejected") throw new Error("permission-denied");
      return false;
    });
    fireEvent.input(screen.getByLabelText("Isi jurnal"), {
      target: { value: "Catatan yang belum tersimpan" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Simpan jurnal" }).closest("form")!,
    );
    await waitFor(() =>
      expect(
        screen
          .getByRole("button", { name: "Simpan jurnal" })
          .hasAttribute("disabled"),
      ).toBe(false),
    );
    expect(
      (screen.getByLabelText("Isi jurnal") as HTMLTextAreaElement).value,
    ).toBe("Catatan yang belum tersimpan");
    expect(dirty).toHaveBeenLastCalledWith(true);
    expect(unload()).toBe(true);
  },
);
function unload() {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}
it("warns before unload only while dirty and clears after cancel or a successful backend save", async () => {
  const { dirty } = journal();
  expect(unload()).toBe(false);
  fireEvent.click(
    await screen.findByRole("button", { name: "Baca Jurnal awal" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Edit jurnal" }));
  expect(unload()).toBe(false);
  fireEvent.input(screen.getByLabelText("Judul (opsional)"), {
    target: { value: "Judul berubah" },
  });
  expect(unload()).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Batal edit" }));
  expect(unload()).toBe(false);
  expect(dirty).toHaveBeenLastCalledWith(false);
  fireEvent.click(screen.getByRole("button", { name: "Edit jurnal" }));
  fireEvent.input(screen.getByLabelText("Isi jurnal"), {
    target: { value: "Jurnal berubah cukup panjang" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Simpan perubahan" }).closest("form")!,
  );
  await screen.findByText("Tersimpan.");
  expect(unload()).toBe(false);
  expect(dirty).toHaveBeenLastCalledWith(false);
});
it("reports changes relative to the actual draft baseline, not merely entering edit mode, and clears on unmount", async () => {
  const { dirty, unmount } = journal();
  await waitFor(() => expect(dirty).toHaveBeenLastCalledWith(false));
  fireEvent.input(screen.getByLabelText("Judul (opsional)"), {
    target: { value: "x" },
  });
  await waitFor(() => expect(dirty).toHaveBeenLastCalledWith(true));
  fireEvent.input(screen.getByLabelText("Judul (opsional)"), {
    target: { value: "" },
  });
  await waitFor(() => expect(dirty).toHaveBeenLastCalledWith(false));
  fireEvent.click(
    await screen.findByRole("button", { name: "Baca Jurnal awal" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Edit jurnal" }));
  expect(
    (screen.getByLabelText("Isi jurnal") as HTMLTextAreaElement).value,
  ).toBe(entry.content);
  await waitFor(() => expect(dirty).toHaveBeenLastCalledWith(false));
  fireEvent.input(screen.getByLabelText("Isi jurnal"), {
    target: { value: entry.content + "!" },
  });
  await waitFor(() => expect(dirty).toHaveBeenLastCalledWith(true));
  fireEvent.input(screen.getByLabelText("Isi jurnal"), {
    target: { value: entry.content },
  });
  await waitFor(() => expect(dirty).toHaveBeenLastCalledWith(false));
  fireEvent.click(screen.getByLabelText("Simpan sebagai favorit"));
  await waitFor(() => expect(dirty).toHaveBeenLastCalledWith(true));
  unmount();
  expect(dirty).toHaveBeenLastCalledWith(false);
});
