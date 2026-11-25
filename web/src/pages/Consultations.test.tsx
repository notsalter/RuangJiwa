import { it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/preact";
import { ConsultationsPage } from "./Consultations";
import { Session } from "../core/session";
import type { Backend } from "../core/types";
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
