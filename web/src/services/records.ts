import type { Collection, Collections } from "../core/types";
import { moodOptions } from "../features/mood";
export function decodeRecord<K extends Collection>(
  name: K,
  id: string,
  data: Record<string, unknown>,
): Collections[K] | null {
  const string = (key: string, required = false) =>
    data[key] === undefined ? !required : typeof data[key] === "string";
  const date = (key: string) =>
    typeof data[key] === "string" && Number.isFinite(Date.parse(data[key]));
  const mood = () =>
    typeof data.mood === "string" &&
    moodOptions.some((m) => m.value === data.mood);
  let valid = name === "psychologists" || string("userId", true);
  if (name === "moods") valid &&= mood() && date("createdAt") && string("note");
  if (name === "journals")
    valid &&=
      string("content", true) &&
      string("title") &&
      string("prompt") &&
      date("createdAt") &&
      (data.mood === undefined || mood()) &&
      (data.tags === undefined ||
        (Array.isArray(data.tags) &&
          data.tags.every((t) => typeof t === "string"))) &&
      (data.isFavorite === undefined || typeof data.isFavorite === "boolean");
  if (name === "psychologists")
    valid &&=
      string("name", true) &&
      string("specialization") &&
      string("bio") &&
      string("photoUrl") &&
      (data.rating === undefined ||
        (typeof data.rating === "number" && Number.isFinite(data.rating)));
  if (name === "consultations")
    valid &&=
      string("psychologistId", true) &&
      typeof data.status === "string" &&
      ["pending", "confirmed", "completed", "canceled"].includes(data.status) &&
      string("scheduledAt") &&
      string("notes");
  if (name === "quizHistory")
    valid &&=
      string("quizType", true) &&
      typeof data.score === "number" &&
      Number.isInteger(data.score) &&
      data.score >= 0 &&
      data.score <= 15 &&
      string("category", true) &&
      date("takenAt");
  return valid ? ({ ...data, id } as unknown as Collections[K]) : null;
}
