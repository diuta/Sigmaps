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
