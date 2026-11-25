export function profileValidation(name: string, photo?: File) {
  if (!name.trim()) return "Nama wajib diisi.";
  if (name.trim().length > 100) return "Nama maksimal 100 karakter.";
  if (photo && !["image/jpeg", "image/png", "image/webp"].includes(photo.type))
    return "Pilih foto JPEG, PNG atau WebP, bukan SVG.";
  if (photo && photo.size > 5 * 1024 * 1024) return "Foto maksimal 5 MB.";
  return "";
}
