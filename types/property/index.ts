export interface PropertyUnit {
  id: string;
  kategori_properti: string;
  jenis_properti: string;
  alamat: string;
  foto_tampak_depan: string | null;
  foto_spanduk: string | null;
  lat: number;
  lng: number;
  jarak_jalan_m?: number | null;
  waktu_jalan_s?: number | null;
  rute?: { type: "LineString"; coordinates: [number, number][] } | null;
}

