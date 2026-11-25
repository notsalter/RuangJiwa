import { it, expect } from "vitest";
import { consultationDraft, canCancel, statusLabel } from "./consultation";
it("requires explicit future time and writes a pending request rather than a confirmed appointment", () => {
  const now = new Date("2026-01-01Z");
  expect(() => consultationDraft("", "2026-02-01T09:00", "", now)).toThrow();
  expect(() => consultationDraft("psy", "2025-02-01", "", now)).toThrow();
  expect(() => consultationDraft("psy", "invalid", "", now)).toThrow();
  expect(
    consultationDraft("psy", "2026-02-01T09:00", " catatan ", now),
  ).toEqual({
    psychologistId: "psy",
    scheduledAt: new Date("2026-02-01T09:00").toISOString(),
    status: "pending",
    notes: "catatan",
  });
  expect(statusLabel("pending")).toContain("Belum terkonfirmasi");
  expect(canCancel("canceled")).toBe(false);
  expect(canCancel("completed")).toBe(false);
  expect(canCancel("pending")).toBe(true);
  expect(canCancel("confirmed")).toBe(false);
  expect(canCancel("unknown")).toBe(false);
});
