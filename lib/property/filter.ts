/**
 * Padanan filter properti — SATU-SATUNYA tempat kosakata filter (Rumah/Kos/Ruko/…, Disewa/Dijual)
 * diterjemahkan ke substring yang dicocokkan ke kolom `kategori_properti` / `jenis_properti`
 * Properti Go. Fungsi murni, aman dipakai di Client Component.
 *
 * Dipakai tiga tempat yang harus selalu sepakat: PropertyLayer (pin di peta), PropertyList
 * (daftar di sidebar), StationSearchBar (menyaring stasiun yang punya unit sesuai). Dulu
 * ketiganya menyalin aturan yang sama; menambah satu tipe properti berarti tiga suntingan, dan
 * kalau satu terlewat peta dan daftar menampilkan himpunan yang berbeda.
 *
 * Nilai di DB dicocokkan sebagai substring huruf kecil, bukan sama persis: `jenis_properti`
 * berisi "Disewa" / "Dijual" / "Sudah Tersewa", `kategori_properti` bisa "Rumah Kos", dst.
 */

export interface FilterOption {
  id: string;
  label: string;
  icon: string;
}

export const PROPERTY_TYPES: readonly FilterOption[] = [
  { id: "rumah", label: "Rumah", icon: "🏠" },
  { id: "kos", label: "Kos", icon: "🛏️" },
  { id: "ruko", label: "Ruko", icon: "🏬" },
  { id: "kantor", label: "Kantor", icon: "🏢" },
  { id: "tanah", label: "Tanah", icon: "🌱" },
  { id: "retail", label: "Retail", icon: "🛍️" },
];

export const TRANSACTION_TYPES: readonly FilterOption[] = [
  { id: "sewa", label: "Disewa", icon: "🏷️" },
  { id: "jual", label: "Dijual", icon: "💰" },
];

/** Substring `kategori_properti` (huruf kecil) yang dianggap cocok untuk tiap id tipe. */
const KATA_KUNCI_TIPE: Record<string, readonly string[]> = {
  rumah: ["rumah"],
  kos: ["kos", "kost"],
  ruko: ["ruko"],
  kantor: ["kantor", "office"],
  tanah: ["tanah", "lahan"],
  retail: ["retail", "ritel", "toko"],
};

/** Substring `jenis_properti` (huruf kecil) untuk tiap id transaksi. */
const KATA_KUNCI_TRANSAKSI: Record<string, readonly string[]> = {
  sewa: ["sewa"],
  jual: ["jual"],
};

function cocok(nilai: string | null | undefined, kunci: readonly string[]): boolean {
  const teks = (nilai || "").toLowerCase();
  return kunci.some((k) => teks.includes(k));
}

/** `types` kosong = tidak menyaring. Id yang tidak dikenal dicocokkan apa adanya (huruf kecil). */
export function matchesPropertyType(
  kategori: string | null | undefined,
  types: readonly string[],
): boolean {
  if (types.length === 0) return true;
  return types.some((t) => cocok(kategori, KATA_KUNCI_TIPE[t] ?? [t.toLowerCase()]));
}

export function matchesTransactionType(
  jenis: string | null | undefined,
  types: readonly string[],
): boolean {
  if (types.length === 0) return true;
  return types.some((t) => cocok(jenis, KATA_KUNCI_TRANSAKSI[t] ?? [t.toLowerCase()]));
}

/** Versi untuk daftar kategori satu stasiun (StationSearchBar): cukup satu kategori yang cocok. */
export function anyMatchesPropertyType(
  kategoriList: readonly string[],
  types: readonly string[],
): boolean {
  if (types.length === 0) return true;
  return kategoriList.some((k) => matchesPropertyType(k, types));
}

export function anyMatchesTransactionType(
  jenisList: readonly string[],
  types: readonly string[],
): boolean {
  if (types.length === 0) return true;
  return jenisList.some((j) => matchesTransactionType(j, types));
}

export interface PropertyUnitFilter {
  propertyTypes: readonly string[];
  transactionTypes: readonly string[];
  /** Hanya unit yang punya foto tampak depan atau spanduk. */
  hasPhotoOnly: boolean;
}

interface FilterableUnit {
  kategori_properti: string | null | undefined;
  jenis_properti: string | null | undefined;
  foto_tampak_depan: string | null | undefined;
  foto_spanduk: string | null | undefined;
}

/** Predikat lengkap satu unit terhadap filter aktif — dipakai PropertyLayer & PropertyList. */
export function matchesPropertyFilter(unit: FilterableUnit, filter: PropertyUnitFilter): boolean {
  if (!matchesPropertyType(unit.kategori_properti, filter.propertyTypes)) return false;
  if (!matchesTransactionType(unit.jenis_properti, filter.transactionTypes)) return false;
  if (filter.hasPhotoOnly && !unit.foto_tampak_depan && !unit.foto_spanduk) return false;
  return true;
}
