import type { Mood } from "../core/types";
export const moodOptions: { value: Mood; label: string; emoji: string }[] = [
  { value: "very_sad", label: "Sangat sedih", emoji: "😢" },
  { value: "sad", label: "Sedih", emoji: "🙁" },
  { value: "neutral", label: "Netral", emoji: "😐" },
  { value: "happy", label: "Senang", emoji: "🙂" },
  { value: "very_happy", label: "Sangat senang", emoji: "😄" },
];
export function moodDraft(mood: string, note: string, now: Date) {
  if (!moodOptions.some((x) => x.value === mood))
    throw new Error("invalid-mood");
  return {
    mood: mood as Mood,
    note: note.trim(),
    createdAt: now.toISOString(),
  };
}
export function moodSeries<
  T extends { id: string; mood: string; createdAt: string },
>(items: T[]) {
  return [...items]
    .filter(
      (x) =>
        Number.isFinite(Date.parse(x.createdAt)) &&
        moodOptions.some((m) => m.value === x.mood),
    )
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .slice(-14)
    .map((x) => ({
      ...x,
      value: moodOptions.findIndex((m) => m.value === x.mood) + 1,
    }));
}
