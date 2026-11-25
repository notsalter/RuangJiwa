import { it, expect } from "vitest";
import { journalDraft, journalPrompts, filterJournals } from "./journal";
it("validates minimum content and preserves title, mood, prompts, tags and favorite schema", () => {
  expect(() => journalDraft({ content: " short " }, new Date())).toThrow();
  expect(journalPrompts).toHaveLength(7);
  expect(
    journalDraft(
      {
        title: " Refleksi ",
        content: "Sepuluh karakter lebih",
        mood: "happy",
        prompt: journalPrompts[0],
        tags: " tenang, kerja, tenang ",
        isFavorite: true,
      },
      new Date("2026-01-01Z"),
    ),
  ).toEqual({
    title: "Refleksi",
    content: "Sepuluh karakter lebih",
    mood: "happy",
    prompt: journalPrompts[0],
    tags: ["tenang", "kerja"],
    isFavorite: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  });
});
it("filters favorites and searches real journal text without changing entries", () => {
  const items = [
    {
      id: "1",
      content: "Hari damai",
      title: "Pagi",
      tags: ["kerja"],
      isFavorite: true,
      createdAt: "2026-01-01",
    },
    { id: "2", content: "Hari lain", createdAt: "2026-01-02" },
  ];
  expect(filterJournals(items, "KERJA", true).map((x) => x.id)).toEqual(["1"]);
  expect(filterJournals(items, "", false).map((x) => x.id)).toEqual(["2", "1"]);
});
