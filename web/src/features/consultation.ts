export function consultationDraft(
  psychologistId: string,
  datetime: string,
  notes: string,
  now = new Date(),
) {
  const scheduled = new Date(datetime);
  if (
    !psychologistId ||
    !Number.isFinite(scheduled.getTime()) ||
    scheduled <= now
  )
    throw new Error("future-time-required");
  return {
    psychologistId,
    scheduledAt: scheduled.toISOString(),
    status: "pending",
    notes: notes.trim(),
  };
}
export const canCancel = (status: string) =>
  status === "pending";
export const statusLabel = (status: string) =>
  ({
    pending: "Permintaan menunggu. Belum terkonfirmasi.",
    confirmed: "Jadwal terkonfirmasi",
    completed: "Selesai",
    canceled: "Dibatalkan",
  })[status] ?? "Status tidak diketahui";
