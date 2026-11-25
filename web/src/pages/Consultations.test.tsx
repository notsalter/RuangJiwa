import { it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/preact";
import { ConsultationsPage } from "./Consultations";
import { Session } from "../core/session";
import type { Backend } from "../core/types";

it.each([2000, 2001])("validates consultation notes length %i before writing", async (length) => {
  const create = vi.fn(async () => {});
  const session = new Session({
    observe: (cb: Parameters<Backend["observe"]>[0]) => {
      cb({ uid: "a", email: null });
      return () => {};
    },
    profile: async () => null,
    list: async (name: string) => name === "psychologists" ? [{ id: "psy", name: "Psikolog uji" }] : [],
    create,
  } as unknown as Backend);
  session.start();
  render(<ConsultationsPage session={session} />);
  fireEvent.click(await screen.findByRole("button", { name: "Detail Psikolog uji" }));
  fireEvent.input(screen.getByLabelText("Waktu konsultasi yang diminta"), { target: { value: "2099-01-01T09:00" } });
  fireEvent.input(screen.getByLabelText("Catatan untuk pengelola (opsional)"), { target: { value: "n".repeat(length) } });
  fireEvent.submit(screen.getByRole("button", { name: "Kirim permintaan" }).closest("form")!);
  if (length === 2001) {
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("2.000 karakter"));
    expect(create).not.toHaveBeenCalled();
  } else {
    await waitFor(() => expect(create).toHaveBeenCalledWith("consultations", "a", expect.objectContaining({ notes: "n".repeat(length) })));
  }
  expect(screen.getByLabelText("Catatan untuk pengelola (opsional)").getAttribute("maxlength")).toBe("2000");
});
it.each(["pending", "confirmed", "completed", "canceled", "unknown"])("offers cancellation only for pending status, not %s", async (status) => {
  const update = vi.fn(async () => {});
  const session = new Session({
    observe: (cb: Parameters<Backend["observe"]>[0]) => {
      cb({ uid: "a", email: null });
      return () => {};
    },
    profile: async () => null,
    list: async (name: string) => name === "psychologists" ? [] : [{
      id: "c", userId: "a", psychologistId: "psy", status,
      scheduledAt: "2099-01-01T09:00:00.000Z",
    }],
    update,
  } as unknown as Backend);
  session.start();
  render(<ConsultationsPage session={session} />);
  const row = await screen.findByRole("article");
  if (status === "pending") {
    fireEvent.click(within(row).getByRole("button", { name: "Batalkan permintaan" }));
    expect(update).not.toHaveBeenCalled();
    fireEvent.click(within(row).getByRole("button", { name: "Ya, batalkan" }));
    await waitFor(() => expect(update).toHaveBeenCalledWith("consultations", "a", "c", { status: "canceled" }));
  } else {
    expect(within(row).queryByRole("button", { name: /[Bb]atalkan/ })).toBeNull();
    expect(within(row).queryByRole("group", { name: "Konfirmasi pembatalan" })).toBeNull();
    expect(update).not.toHaveBeenCalled();
    if (status === "confirmed") expect(within(row).getByText(/Hubungi pengelola/)).toBeTruthy();
    if (status === "completed") expect(within(row).getByText(/tidak dapat dibatalkan/)).toBeTruthy();
  }
});

it("closes cancellation confirmation when a pending request becomes confirmed", async () => {
  let status = "pending";
  const update = vi.fn(async () => {});
  const session = new Session({
    observe: (cb: Parameters<Backend["observe"]>[0]) => {
      cb({ uid: "a", email: null });
      return () => {};
    },
    profile: async () => null,
    list: async (name: string) => name === "psychologists" ? [] : [{
      id: "c", userId: "a", psychologistId: "psy", status,
      scheduledAt: "2099-01-01T09:00:00.000Z",
    }],
    update,
  } as unknown as Backend);
  session.start();
  render(<ConsultationsPage session={session} />);
  fireEvent.click(await screen.findByRole("button", { name: "Batalkan permintaan" }));
  expect(screen.getByRole("group", { name: "Konfirmasi pembatalan" })).toBeTruthy();
  status = "confirmed";
  await session.load("consultations");
  await waitFor(() => expect(screen.queryByRole("group", { name: "Konfirmasi pembatalan" })).toBeNull());
  expect(screen.queryByRole("button", { name: "Ya, batalkan" })).toBeNull();
  expect(update).not.toHaveBeenCalled();
});

it("reads directory and detail, requests a chosen future time, cancels explicitly and only exports confirmed reminders", async () => {
  const create = vi.fn(async () => {}),
    update = vi.fn(async () => {});
  const session = new Session({
    observe: (cb: Parameters<Backend["observe"]>[0]) => {
      cb({ uid: "a", email: null });
      return () => {};
    },
    profile: async () => null,
    list: async (name: string) =>
      name === "psychologists"
        ? [
            {
              id: "psy",
              name: "Psikolog uji",
              specialization: "Spesialisasi uji",
              bio: "Biografi dari boundary uji",
              photoUrl: "javascript:alert(1)",
            },
          ]
        : [
            {
              id: "c",
              userId: "a",
              psychologistId: "psy",
              status: "pending",
              scheduledAt: "2099-01-01T09:00:00Z",
            },
            {
              id: "d",
              userId: "a",
              psychologistId: "psy",
              status: "confirmed",
              scheduledAt: "2099-01-02T09:00:00Z",
            },
          ],
    create,
    update,
  } as unknown as Backend);
  session.start();
  render(<ConsultationsPage session={session} />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Detail Psikolog uji" }),
  );
  expect(screen.getByText("Biografi dari boundary uji")).toBeTruthy();
  expect(screen.queryAllByRole("img")).toHaveLength(0);
  fireEvent.submit(
    screen.getByRole("button", { name: "Kirim permintaan" }).closest("form")!,
  );
  expect(screen.getByRole("alert").textContent).toContain("mendatang");
  expect(create).not.toHaveBeenCalled();
  fireEvent.input(screen.getByLabelText("Waktu konsultasi yang diminta"), {
    target: { value: "2099-02-01T09:00" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Kirim permintaan" }).closest("form")!,
  );
  await waitFor(() =>
    expect(create).toHaveBeenCalledWith(
      "consultations",
      "a",
      expect.objectContaining({ psychologistId: "psy", status: "pending" }),
    ),
  );
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "Kirim permintaan" })
        .hasAttribute("disabled"),
    ).toBe(false),
  );
  expect(
    screen.getAllByRole("button", { name: "Siapkan kalender" }),
  ).toHaveLength(1);
  fireEvent.click(
    screen.getAllByRole("button", { name: "Batalkan permintaan" })[0],
  );
  expect(update).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Ya, batalkan" }));
  await waitFor(() =>
    expect(update).toHaveBeenCalledWith("consultations", "a", "c", {
      status: "canceled",
    }),
  );
});
