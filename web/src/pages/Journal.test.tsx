import { it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/preact";
import { JournalPage } from "./Journal";
import { Session } from "../core/session";
import type { Backend } from "../core/types";

it.each([
  ["Judul (opsional)", "j".repeat(161), "160 karakter"],
  ["Isi jurnal", "i".repeat(10001), "10.000 karakter"],
  ["Tag (pisahkan dengan koma)", "t".repeat(41), "40 karakter"],
  ["Tag (pisahkan dengan koma)", Array.from({ length: 11 }, (_, i) => `tag${i}`).join(","), "10 tag"],
])("rejects journal field %s outside schema bounds before writing", async (label, value, message) => {
  const create = vi.fn();
  const session = new Session({
    observe: (cb: Parameters<Backend["observe"]>[0]) => {
      cb({ uid: "a", email: null });
      return () => {};
    },
    profile: async () => null,
    list: async () => [],
    create,
  } as unknown as Backend);
  session.start();
  render(<JournalPage session={session} />);
  fireEvent.input(screen.getByLabelText("Isi jurnal"), {
    target: { value: "Catatan cukup panjang" },
  });
  fireEvent.input(screen.getByLabelText(label), { target: { value } });
  fireEvent.submit(screen.getByRole("button", { name: "Simpan jurnal" }).closest("form")!);
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain(message));
  expect(create).not.toHaveBeenCalled();
});

it("uses schema-aligned journal input limits and explains tag limits", () => {
  const session = new Session({
    observe: (cb: Parameters<Backend["observe"]>[0]) => {
      cb({ uid: "a", email: null });
      return () => {};
    },
    profile: async () => null,
    list: async () => [],
  } as unknown as Backend);
  session.start();
  render(<JournalPage session={session} />);
  expect(screen.getByLabelText("Judul (opsional)").getAttribute("maxlength")).toBe("160");
  expect(screen.getByLabelText("Isi jurnal").getAttribute("maxlength")).toBe("10000");
  expect(screen.getByLabelText("Tag (pisahkan dengan koma)").getAttribute("maxlength")).toBe("418");
  expect(screen.getByText("Maksimal 10 tag, masing-masing 40 karakter.")).toBeTruthy();
});
it("creates a journal then reads, edits, favorites and explicitly confirms deletion", async () => {
  const entry = {
    id: "j",
    userId: "a",
    title: "Jurnal asli",
    content: "Catatan yang cukup panjang",
    createdAt: "2026-01-01Z",
    isFavorite: false,
  };
  const create = vi.fn(async () => {}),
    update = vi.fn(async () => {}),
    remove = vi.fn(async () => {});
  const session = new Session({
    observe: (cb: Parameters<Backend["observe"]>[0]) => {
      cb({ uid: "a", email: null });
      return () => {};
    },
    profile: async () => null,
    list: async () => [entry],
    create,
    update,
    remove,
  } as unknown as Backend);
  session.start();
  render(<JournalPage session={session} />);
  fireEvent.input(screen.getByLabelText("Isi jurnal"), {
    target: { value: "Catatan baru lebih dari sepuluh karakter" },
  });
  fireEvent.input(screen.getByLabelText("Judul (opsional)"), {
    target: { value: "Judul baru" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Simpan jurnal" }).closest("form")!,
  );
  await waitFor(() =>
    expect(create).toHaveBeenCalledWith(
      "journals",
      "a",
      expect.objectContaining({ title: "Judul baru" }),
    ),
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Baca Jurnal asli" }),
  );
  expect(screen.getByText(entry.content)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Favoritkan" }));
  await waitFor(() =>
    expect(update).toHaveBeenCalledWith("journals", "a", "j", {
      isFavorite: true,
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Edit jurnal" }));
  fireEvent.input(screen.getByLabelText("Isi jurnal"), {
    target: { value: "Isi berubah tetap cukup panjang" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Simpan perubahan" }).closest("form")!,
  );
  await waitFor(() =>
    expect(update).toHaveBeenCalledWith(
      "journals",
      "a",
      "j",
      expect.objectContaining({ content: "Isi berubah tetap cukup panjang" }),
    ),
  );
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "Simpan jurnal" })
        .hasAttribute("disabled"),
    ).toBe(false),
  );
  fireEvent.click(screen.getByRole("button", { name: "Hapus jurnal" }));
  expect(remove).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Ya, hapus permanen" }));
  await waitFor(() =>
    expect(remove).toHaveBeenCalledWith("journals", "a", "j"),
  );
});
it.each([
  ["title", "t".repeat(161), "160 karakter"],
  ["content", "c".repeat(10001), "10.000 karakter"],
  ["prompt", "p".repeat(1001), "1.000 karakter"],
] as const)("rejects an oversized existing journal %s before an edit write", async (field, value, message) => {
  const update = vi.fn(async () => {});
  const session = new Session({
    observe: (cb: Parameters<Backend["observe"]>[0]) => {
      cb({ uid: "a", email: null });
      return () => {};
    },
    profile: async () => null,
    list: async () => [{
      id: "j", userId: "a", content: "Catatan cukup panjang",
      createdAt: "2026-01-01T00:00:00.000Z", [field]: value,
    }],
    update,
  } as unknown as Backend);
  session.start();
  render(<JournalPage session={session} />);
  fireEvent.click(await screen.findByRole("button", { name: /^Baca/ }));
  fireEvent.click(screen.getByRole("button", { name: "Edit jurnal" }));
  fireEvent.submit(screen.getByRole("button", { name: "Simpan perubahan" }).closest("form")!);
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain(message));
  expect(update).not.toHaveBeenCalled();
});

it("rejects trimmed short content before attempting a backend write", () => {
  const create = vi.fn();
  const session = new Session({
    observe: (cb: Parameters<Backend["observe"]>[0]) => {
      cb({ uid: "a", email: null });
      return () => {};
    },
    profile: async () => null,
    list: async () => [],
    create,
  } as unknown as Backend);
  session.start();
  render(<JournalPage session={session} />);
  fireEvent.input(screen.getByLabelText("Isi jurnal"), {
    target: { value: "  pendek  " },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Simpan jurnal" }).closest("form")!,
  );
  expect(screen.getByRole("alert").textContent).toContain("10 karakter");
  expect(create).not.toHaveBeenCalled();
});
