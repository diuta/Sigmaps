/**
 * Dulu berisi `options` (mode `organic`/`radius` dan `radiusMeter`) yang dipakai
 * `lib/map/isochrone-generator.ts` untuk membangkitkan lingkaran sintetis, selama
 * poligon MAPID belum tersedia.
 *
 * Keduanya SUDAH DIHAPUS. Poligon isokron sekarang datang asli dari MAPID
 * Isochrone Tool (`foot`, 600 detik) lewat /api/stations → `properties.isokron`,
 * jadi bentuknya tidak bisa — dan tidak boleh — diubah dari klien.
 *
 * Yang tersisa cuma luas kawasan aktif, dan sekarang isinya lebih baik daripada
 * sebelumnya: luas geodesik sebenarnya dari database (`ST_Area(geom::geography)`),
 * angka yang sama persis dipakai sebagai penyebut rumus C. Versi lama menampilkan
 * hitungan kasar generator, yang tidak pernah cocok dengan penyebut itu.
 */
export interface IsochroneConfigContextValue {
  /** Luas kawasan aktif dalam km². 0 kalau belum ada stasiun dipilih. */
  calculatedAreaKm2: number;
  setCalculatedAreaKm2: (area: number) => void;
}
