import { it, expect } from "vitest";
import { decodeRecord } from "./records";
it("uses the document id, validates known schema types and skips malformed backend records safely", () => {
  expect(
    decodeRecord("moods", "real-id", {
      id: "forged",
      userId: "a",
      mood: "happy",
      createdAt: "2026-01-01Z",
      note: "note",
    })?.id,
  ).toBe("real-id");
  expect(
    decodeRecord("moods", "m", {
      userId: "a",
      mood: "unknown",
      createdAt: "2026-01-01Z",
    }),
  ).toBeNull();
  expect(
    decodeRecord("journals", "j", {
      userId: "a",
      content: { malicious: "object" },
      createdAt: "2026-01-01",
    }),
  ).toBeNull();
  expect(
    decodeRecord("journals", "j", {
      userId: "a",
      content: "journal content",
      tags: "bad",
      createdAt: "2026-01-01",
    }),
  ).toBeNull();
  expect(
    decodeRecord("psychologists", "p", {
      name: "Real directory name",
      bio: { bad: "object" },
    }),
  ).toBeNull();
  expect(
    decodeRecord("quizHistory", "q", {
      userId: "a",
      quizType: "stress",
      score: 99,
      category: "high",
      takenAt: "2026-01-01",
    }),
  ).toBeNull();
  expect(
    decodeRecord("consultations", "c", {
      userId: "a",
      psychologistId: "p",
      status: "pending",
      scheduledAt: "2026-01-01",
    }),
  ).toEqual({
    id: "c",
    userId: "a",
    psychologistId: "p",
    status: "pending",
    scheduledAt: "2026-01-01",
  });
});
