import { it, expect } from "vitest";
import { decodeRecord } from "./records";
const journal = {
  userId: "a", content: "Long existing journal content", createdAt: "2026-01-01T00:00:00.000Z",
};
it.each([
  ["journals", { ...journal, title: "x".repeat(161) }],
  ["journals", { ...journal, content: "short" }],
  ["journals", { ...journal, tags: [""] }],
  ["moods", { userId: "a", mood: "happy", createdAt: "2026-02-30T00:00:00.000Z" }],
  ["moods", { userId: "a", mood: "happy", createdAt: journal.createdAt, unknown: true }],
  ["moods", { userId: "a", mood: "happy", createdAt: journal.createdAt, id: "forged" }],
  ["quizHistory", { userId: "a", quizType: "fake", score: 6, category: "low", takenAt: journal.createdAt }],
  ["quizHistory", { userId: "a", quizType: "stress", score: 7, category: "low", takenAt: journal.createdAt }],
  ["consultations", { userId: "a", psychologistId: "p", status: "pending", scheduledAt: "invalid" }],
] as const)("rejects malformed %s read %#", (name, data) => {
  expect(decodeRecord(name, "real-id", data)).toBeNull();
});
it("uses the document id, validates known schema types and skips malformed backend records safely", () => {
  expect(
    decodeRecord("moods", "real-id", {
      userId: "a",
      mood: "happy",
      createdAt: journal.createdAt,
      note: "note",
    })?.id,
  ).toBe("real-id");
  expect(
    decodeRecord("moods", "m", {
      userId: "a",
      mood: "unknown",
      createdAt: journal.createdAt,
    }),
  ).toBeNull();
  expect(
    decodeRecord("journals", "j", {
      userId: "a",
      content: { malicious: "object" },
      createdAt: journal.createdAt,
    }),
  ).toBeNull();
  expect(
    decodeRecord("journals", "j", {
      userId: "a",
      content: "journal content",
      tags: "bad",
      createdAt: journal.createdAt,
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
      takenAt: journal.createdAt,
    }),
  ).toBeNull();
  expect(
    decodeRecord("consultations", "c", {
      userId: "a",
      psychologistId: "p",
      status: "pending",
      scheduledAt: journal.createdAt,
    }),
  ).toEqual({
    id: "c",
    userId: "a",
    psychologistId: "p",
    status: "pending",
    scheduledAt: journal.createdAt,
  });
});
