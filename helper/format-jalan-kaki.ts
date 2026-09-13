/**
 * Format jarak (meter) + durasi (detik) jalan kaki jadi teks pendek untuk UI.
 * Generik — tidak tahu apa-apa soal SIGMAPS, cocok di helper/ (CLAUDE.md §2b).
 *
 *   formatJalanKaki(345, 276)  -> "≈ 350 m · 5 mnt jalan kaki"
 *   formatJalanKaki(1829, 1460) -> "≈ 1,8 km · 24 mnt jalan kaki"
 *   formatJalanKaki(13, 10)    -> "< 50 m · di lokasi stasiun"
 *   formatJalanKaki(null, null) -> null   (belum ada datanya, jangan tampilkan apa-apa)
 */
export function formatJalanKaki(
  jarakM: number | null | undefined,
  waktuS: number | null | undefined,
): string | null {
  if (jarakM == null || waktuS == null) return null;
  if (jarakM < 50) return "< 50 m · di lokasi stasiun";

  const jarak =
    jarakM >= 1000
      ? `${(jarakM / 1000).toFixed(1).replace(".", ",")} km`
      : `${Math.round(jarakM / 10) * 10} m`;
  const menit = Math.max(1, Math.round(waktuS / 60));
  return `≈ ${jarak} · ${menit} mnt jalan kaki`;
}
