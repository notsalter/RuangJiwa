import { it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/preact";
import { MoodPage } from "./Mood";
import { Session } from "../core/session";
import type { Backend } from "../core/types";

it.each([2000, 2001])("validates mood note length %i before writing", async (length) => {
  const create = vi.fn(async () => {});
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
  render(<MoodPage session={session} />);
  fireEvent.input(screen.getByLabelText("Catatan (opsional)"), {
    target: { value: "n".repeat(length) },
  });
  fireEvent.submit(screen.getByRole("button", { name: "Simpan mood" }).closest("form")!);
  if (length === 2001) {
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("2.000 karakter"));
    expect(create).not.toHaveBeenCalled();
  } else {
    await waitFor(() => expect(create).toHaveBeenCalledWith("moods", "a", expect.objectContaining({ note: "n".repeat(length) })));
  }
  expect(screen.getByLabelText("Catatan (opsional)").getAttribute("maxlength")).toBe("2000");
});
it("saves a real mood draft, shows recorded history/chart and creates a calendar download without notifications", async () => {
  const create = vi.fn(async () => {});
  const session = new Session({
    observe: (cb: Parameters<Backend["observe"]>[0]) => {
      cb({ uid: "a", email: null });
      return () => {};
    },
    profile: async () => null,
    list: async () => [
      {
        id: "m",
        userId: "a",
        mood: "sad",
        note: "catatan lama",
        createdAt: "2026-01-01T10:00:00Z",
      },
    ],
    create,
  } as unknown as Backend);
  session.start();
  render(<MoodPage session={session} />);
  fireEvent.click(screen.getByLabelText(/Sangat senang/));
  fireEvent.input(screen.getByLabelText("Catatan (opsional)"), {
    target: { value: "Hari yang tenang" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Simpan mood" }).closest("form")!,
  );
  await waitFor(() =>
    expect(create).toHaveBeenCalledWith(
      "moods",
      "a",
      expect.objectContaining({ mood: "very_happy", note: "Hari yang tenang" }),
    ),
  );
  expect(await screen.findByText("catatan lama")).toBeTruthy();
  expect(screen.getByRole("img", { name: /Pola mood/ })).toBeTruthy();
  fireEvent.input(screen.getByLabelText("Waktu pengingat mood"), {
    target: { value: "2099-01-01T09:00" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Siapkan kalender" }));
  expect(
    screen
      .getByRole("link", { name: "Unduh pengingat .ics" })
      .getAttribute("href"),
  ).toMatch(/^data:text\/calendar/);
  expect(screen.getByText(/aplikasi kalender/)).toBeTruthy();
});
it("shows all mood history while limiting the visual chart to fourteen points", async () => {
  const rows = Array.from({ length: 20 }, (_, i) => ({
    id: String(i),
    userId: "a",
    mood: "happy",
    note: `Catatan nomor ${i}`,
    createdAt: `2026-01-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
  }));
  const session = new Session({
    observe: (cb: Parameters<Backend["observe"]>[0]) => {
      cb({ uid: "a", email: null });
      return () => {};
    },
    profile: async () => null,
    list: async () => rows,
  } as unknown as Backend);
  session.start();
  render(<MoodPage session={session} />);
  expect(await screen.findByText("Catatan nomor 0")).toBeTruthy();
  expect(screen.getAllByRole("article")).toHaveLength(20);
  expect(screen.getByRole("img").querySelectorAll("circle")).toHaveLength(14);
});
