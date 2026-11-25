import { expect, it } from "vitest";
import { journalDraft, journalPrompts, type JournalDraft } from "../features/journal";
import { moodDraft } from "../features/mood";
import { consultationDraft } from "../features/consultation";
import { validRecord } from "../services/validation";
import { formLimits, journalFormError, noteFormError } from "./forms";

const now = new Date("2026-01-01T00:00:00.000Z");
const draft: JournalDraft = { content: "Catatan cukup panjang" };
const persisted = (data: Record<string, unknown>) => ({
  ...Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)),
  userId: "a",
});

it.each([
  ["title", 160, "160 karakter"],
  ["content", 10000, "10.000 karakter"],
  ["prompt", 1000, "1.000 karakter"],
] as const)("matches journal %s schema boundary without truncation", (field, max, message) => {
  const input = { ...draft, [field]: "x".repeat(max) };
  expect(journalFormError(input)).toBe("");
  const data = journalDraft(input, now);
  expect(data[field]).toHaveLength(max);
  expect(validRecord("journals", persisted(data))).toBe(true);
  const overflow = { ...input, [field]: "x".repeat(max + 1) };
  expect(journalFormError(overflow)).toContain(message);
  expect(validRecord("journals", persisted(journalDraft(overflow, now)))).toBe(false);
});

it("accepts ten unique forty-character tags including edit separators", () => {
  const tags = Array.from({ length: 10 }, (_, i) => String(i).padEnd(40, "x"));
  const input = { ...draft, tags: tags.join(", ") };
  expect(input.tags).toHaveLength(formLimits.journalTagsInput);
  expect(journalFormError(input)).toBe("");
  const data = journalDraft(input, now);
  expect(data.tags).toEqual(tags);
  expect(validRecord("journals", persisted(data))).toBe(true);
});

it("validates normalized tags and optional text exactly as the draft stores them", () => {
  const input = {
    ...draft,
    title: ` ${"t".repeat(160)} `,
    content: ` ${"c".repeat(10000)} `,
    tags: ` , ${"t".repeat(40)}, ${"t".repeat(40)}, , `,
  };
  expect(journalFormError(input)).toBe("");
  const data = journalDraft(input, now);
  expect(data.tags).toEqual(["t".repeat(40)]);
  expect(validRecord("journals", persisted(data))).toBe(true);
  expect(journalPrompts.every((prompt) => prompt.length <= formLimits.journalPrompt)).toBe(true);
});

it.each(["mood", "consultation"] as const)("matches %s note schema boundary without truncation", (kind) => {
  const data = (note: string) => kind === "mood"
    ? ["moods", persisted(moodDraft("happy", note, now))] as const
    : ["consultations", persisted(consultationDraft("psy", "2099-01-01T09:00", note, now))] as const;
  expect(noteFormError(` ${"n".repeat(2000)} `, kind)).toBe("");
  const boundary = data("n".repeat(2000));
  expect(validRecord(boundary[0], boundary[1])).toBe(true);
  expect(noteFormError("n".repeat(2001), kind)).toContain("2.000 karakter");
  const overflow = data("n".repeat(2001));
  expect(validRecord(overflow[0], overflow[1])).toBe(false);
});