import type { JournalDraft } from "../features/journal";

export const formLimits = {
  journalTitle: 160,
  journalContent: 10000,
  journalPrompt: 1000,
  journalTags: 10,
  journalTag: 40,
  journalTagsInput: 418,
  moodNote: 2000,
  consultationNotes: 2000,
} as const;

export function journalFormError(input: JournalDraft): string {
  if (input.content.trim().length < 10)
    return "Isi jurnal minimal 10 karakter setelah spasi tepi dihapus.";
  if ((input.title?.trim().length ?? 0) > formLimits.journalTitle)
    return "Judul maksimal 160 karakter.";
  if (input.content.trim().length > formLimits.journalContent)
    return "Isi jurnal maksimal 10.000 karakter.";
  if ((input.prompt?.length ?? 0) > formLimits.journalPrompt)
    return "Prompt maksimal 1.000 karakter.";
  const tags = [...new Set((input.tags ?? "").split(",").map((tag) => tag.trim()).filter(Boolean))];
  if (tags.length > formLimits.journalTags)
    return "Maksimal 10 tag.";
  if (tags.some((tag) => tag.length > formLimits.journalTag))
    return "Setiap tag maksimal 40 karakter.";
  return "";
}

export function noteFormError(note: string, kind: "mood" | "consultation"): string {
  const max = kind === "mood" ? formLimits.moodNote : formLimits.consultationNotes;
  return note.trim().length > max ? "Catatan maksimal 2.000 karakter." : "";
}
