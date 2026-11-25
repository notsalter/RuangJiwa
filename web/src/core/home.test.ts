import { it, expect } from "vitest";
import { greeting, latestMood, nextConsultation } from "./home";
it("chooses latest mood and excludes canceled, completed, past and invalid consultations", () => {
  expect(greeting(8)).toBe("Selamat pagi");
  expect(greeting(14)).toBe("Selamat siang");
  expect(greeting(17)).toBe("Selamat sore");
  expect(greeting(22)).toBe("Selamat malam");
  expect(
    latestMood([
      { id: "old", createdAt: "2026-01-01" },
      { id: "new", createdAt: "2026-02-01" },
    ])?.id,
  ).toBe("new");
  const items = [
    { id: "canceled", status: "canceled", scheduledAt: "2026-01-02" },
    { id: "completed", status: "completed", scheduledAt: "2026-01-02" },
    { id: "past", status: "confirmed", scheduledAt: "2025-01-02" },
    { id: "bad", status: "pending", scheduledAt: "bad" },
    { id: "request", status: "pending", scheduledAt: "2026-01-03" },
    { id: "later", status: "confirmed", scheduledAt: "2026-01-04" },
  ];
  expect(nextConsultation(items, Date.parse("2026-01-01"))?.id).toBe("request");
});
