export const greeting = (hour: number) =>
  hour < 12
    ? "Selamat pagi"
    : hour < 15
      ? "Selamat siang"
      : hour < 18
        ? "Selamat sore"
        : "Selamat malam";
export const latestMood = <T extends { createdAt: string }>(items: T[]) =>
  [...items]
    .filter((x) => Number.isFinite(Date.parse(x.createdAt)))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
export const nextConsultation = <
  T extends { status: string; scheduledAt?: string },
>(
  items: T[],
  now: number,
) =>
  [...items]
    .filter(
      (x) =>
        ["pending", "confirmed"].includes(x.status) &&
        Date.parse(x.scheduledAt ?? "") > now,
    )
    .sort((a, b) => Date.parse(a.scheduledAt!) - Date.parse(b.scheduledAt!))[0];
