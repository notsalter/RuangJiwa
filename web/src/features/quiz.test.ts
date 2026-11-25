import { it, expect } from "vitest";
import { quizzes, scoreQuiz } from "./quiz";
it("preserves both five-question quizzes and rejects incomplete or invalid answers", () => {
  expect(quizzes.map((x) => x.id)).toEqual(["stress", "anxiety"]);
  expect(quizzes.every((x) => x.questions.length === 5)).toBe(true);
  expect(quizzes[0].questions[0]).toBe(
    "Seberapa sering kamu merasa kewalahan oleh tanggung jawab?",
  );
  expect(() => scoreQuiz("stress", [0, 1])).toThrow();
  expect(() => scoreQuiz("stress", [0, 1, 2, 3, 4])).toThrow();
  expect(() => scoreQuiz("unknown", [0, 0, 0, 0, 0])).toThrow();
});
it("scores category boundaries exactly at 0,6,7,12,13,15", () => {
  for (const [answers, score, category] of [
    [[0, 0, 0, 0, 0], 0, "low"],
    [[3, 3, 0, 0, 0], 6, "low"],
    [[3, 3, 1, 0, 0], 7, "moderate"],
    [[3, 3, 3, 3, 0], 12, "moderate"],
    [[3, 3, 3, 3, 1], 13, "high"],
    [[3, 3, 3, 3, 3], 15, "high"],
  ] as const)
    expect(scoreQuiz("stress", [...answers])).toEqual({ score, category });
});
