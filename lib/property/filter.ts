/**
 * Padanan filter properti — SATU-SATUNYA tempat kosakata filter (Rumah/Kos/Ruko/…, Disewa/Dijual)
 * diterjemahkan ke substring yang dicocokkan ke kolom `kategori_properti` / `jenis_properti`
 * Properti Go. Fungsi murni, aman dipakai di Client Component. Dipakai PropertyLayer (pin),
 * PropertyList (daftar), StationSearchBar (saring stasiun) — ketiganya harus selalu sepakat.
 *
 * Nilai di DB dicocokkan sebagai substring huruf kecil, bukan sama persis: `jenis_properti`
 * berisi "Disewa" / "Dijual" / "Sudah Tersewa", `kategori_properti` bisa "Rumah Kos", dst.
 */

import type { PropertyUnit } from "@/types/property";

export const PROPERTY_TYPES = [
  { id: "rumah", label: "Rumah", icon: "🏠" },
  { id: "kos", label: "Kos", icon: "🛏️" },
  { id: "ruko", label: "Ruko", icon: "🏬" },
  { id: "kantor", label: "Kantor", icon: "🏢" },
  { id: "tanah", label: "Tanah", icon: "🌱" },
  { id: "retail", label: "Retail", icon: "🛍️" },
] as const;

export const TRANSACTION_TYPES = [
  { id: "sewa", label: "Disewa", icon: "🏷️" },
  { id: "jual", label: "Dijual", icon: "💰" },
] as const;

/** `types` kosong = tidak menyaring. Id di luar kamus dicocokkan apa adanya (huruf kecil). */
const matcher =
  (kamus: Record<string, readonly string[]>) =>
  (nilai: string | null | undefined, types: readonly string[]): boolean =>
    types.length === 0 ||
    types.some((t) => (kamus[t] ?? [t.toLowerCase()]).some((k) => (nilai || "").toLowerCase().includes(k)));

export const matchesPropertyType = matcher({
  rumah: ["rumah"],
  kos: ["kos", "kost"],
  ruko: ["ruko"],
  kantor: ["kantor", "office"],
  tanah: ["tanah", "lahan"],
  retail: ["retail", "ritel", "toko"],
});

export const matchesTransactionType = matcher({
  sewa: ["sewa"],
  jual: ["jual"],
});

interface PropertyUnitFilter {
  propertyTypes: readonly string[];
  transactionTypes: readonly string[];
  /** Hanya unit yang punya foto tampak depan atau spanduk. */
  hasPhotoOnly: boolean;
}

/** Predikat lengkap satu unit terhadap filter aktif — dipakai PropertyLayer & PropertyList. */
export function matchesPropertyFilter(
  unit: Pick<PropertyUnit, "kategori_properti" | "jenis_properti" | "foto_tampak_depan" | "foto_spanduk">,
  filter: PropertyUnitFilter,
): boolean {
  return (
    matchesPropertyType(unit.kategori_properti, filter.propertyTypes) &&
    matchesTransactionType(unit.jenis_properti, filter.transactionTypes) &&
    (!filter.hasPhotoOnly || !!unit.foto_tampak_depan || !!unit.foto_spanduk)
  );
}
