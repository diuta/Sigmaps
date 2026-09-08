-- Jalankan file ini sekali di Supabase SQL Editor, urutan atas-ke-bawah, setelah keenam
-- tabel MVP dibuat (context/dokumentasi-erd-mvp.md). Isinya:
--   1. SQL view yang dipanggil dari Next.js API Routes lewat supabase-js biasa
--      (`supabaseServer.from(view).select().eq(...)`), bukan `.rpc()`.
--   2. GRANT wajib untuk `service_role` (lihat penjelasan di bagian bawah file).
--
-- Kenapa perlu view (bukan cuma query builder murni ke tabel) — HANYA untuk dua alasan ini,
-- bukan alasan generik "biar rapi":
-- 1. PostgREST tidak expose ST_Within/spatial join lewat filter `.eq()`/`.gt()` biasa — join
--    keanggotaan kawasan (properti_go/community_activity -> scored_areas) wajib pakai
--    ST_Within (lihat context/dokumentasi-erd-mvp.md "Kenapa hampir tidak ada foreign key").
-- 2. Kolom geometry (PostGIS) perlu dikonversi ke GeoJSON (`ST_AsGeoJSON`) di sisi database —
--    PostgREST default mengembalikan WKB hex, bukan GeoJSON, kalau kolom geometry dibaca
--    langsung, dan tidak ada cara mem-parsing WKB itu di JS tanpa library tambahan.
--
-- ⚠️ Tabel `stasiun` SENGAJA TIDAK punya view di sini (beda dari versi sebelumnya file ini,
-- yang sempat punya `stasiun_geojson`) — `stasiun` menyimpan koordinat sebagai dua kolom
-- angka biasa (`longitude`, `latitude`), bukan kolom geometry PostGIS, dan tidak ada spatial
-- join yang menyentuhnya. Kedua alasan di atas tidak berlaku untuk tabel ini, jadi
-- transformasinya (cuma susun jadi GeoJSON Point; `tipe_3` dipertahankan apa adanya, tidak
-- dialiaskan) cukup dilakukan di JavaScript (`lib/stations.ts`), tidak butuh SQL sama
-- sekali. `app/api/stations/route.ts`
-- query `stasiun` langsung. Lihat docs/lib-stations.md untuk detail lengkap perbandingannya.
drop view if exists stasiun_geojson;

-- Dipanggil dari:
--   - app/api/properties/route.ts                        -> properti_go_by_station
--   - app/api/community-sentiment/route.ts               -> community_activity_by_station
--   - lib/tipe3.ts (dipakai app/api/prompt-request & app/api/score) -> tipe3_values

create or replace view properti_go_by_station as
select
  a.station_id,
  p.id,
  p.kategori_properti,
  p.jenis_properti,
  p.alamat,
  p.foto_tampak_depan,
  p.foto_spanduk,
  ST_AsGeoJSON(p.geom)::json as geom
from properti_go p
join scored_areas a on ST_Within(p.geom, a.geom);

create or replace view community_activity_by_station as
select
  a.station_id,
  c.title,
  c.description,
  c.total_comment,
  c.likes
from community_activity c
join scored_areas a on ST_Within(c.geom, a.geom);

-- Titik stasiun + kawasan isokronnya, satu baris per stasiun.
--
-- Catatan di kepala berkas ini benar: tabel `stasiun` SENDIRI tidak butuh view, karena
-- koordinatnya dua kolom angka biasa dan tidak ada spatial join yang menyentuhnya. View ini
-- ada karena alasan yang BERBEDA — dia menarik `scored_areas.geom`, yang memang kolom
-- geometry PostGIS, sehingga jatuh tepat ke alasan nomor 2 di atas: PostgREST mengembalikan
-- WKB hex untuk kolom geometry, bukan GeoJSON.
--
-- LEFT JOIN, bukan INNER: kalau pipeline batch belum jalan, `scored_areas` kosong dan
-- stasiunnya tetap harus tampil di peta — `isokron`, `area_km2`, dan `is_rankable` bernilai
-- NULL, dan itu kondisi normal, bukan galat.
--
-- Dipakai app/api/stations/route.ts untuk dua hal sekaligus:
--   1. IsochroneLayer menggambar POLIGON MAPID ASLI, menggantikan lingkaran sintetis dari
--      lib/map/isochrone-generator.ts (helper sementara dari masa B-1 masih memblokir).
--   2. `is_rankable` memberi peta penanda "data belum cukup" (context-mvp.md §6.8). Tanpa
--      ini, 32 kawasan yang belum bisa dinilai terlihat sama dengan kawasan yang sudah
--      dinilai tapi skornya rendah — ketiadaan data tersaji seolah penilaian negatif.
--      Penandanya tidak bisa datang dari /api/score, yang sengaja hanya mengirim Top 5.
create or replace view stasiun_kawasan as
select
  s.station_id,
  s.nama,
  s.tipe_3,
  s.kecamatan,
  s.kabkot,
  s.longitude,
  s.latitude,
  a.area_id,
  a.area_km2,
  a.is_rankable,
  ST_AsGeoJSON(a.geom)::json as isokron
from stasiun s
left join scored_areas a on a.station_id = s.station_id;

-- Sumber tunggal daftar TIPE_3 (context/context-mvp.md §6.8b: "TIPE_3_VALUES wajib
-- dihasilkan dari query, bukan diketik manual" — mencegah enum kode dan isi tabel diam-diam
-- berbeda). Ini juga butuh view walau tidak ada geometry/join sama sekali, karena PostgREST
-- tidak punya cara menyatakan DISTINCT lewat query builder (`.from().select()` biasa selalu
-- ambil semua baris apa adanya) — alasannya beda dari dua view di atas, tapi sama-sama
-- sesuatu yang genuinely tidak bisa dilakukan tanpa SQL. ORDER BY di sini kosmetik saja;
-- lib/tipe3.ts mengurutkan ulang di sisi klien karena PostgREST tidak menjamin urutan view
-- tetap terjaga.
create or replace view tipe3_values as
select distinct tipe_3 from katalog_restoran order by tipe_3;

-- ============================================================================
-- GRANT wajib untuk service_role — ditemukan 6 September 2026 lewat testing langsung:
-- `select station_id from stasiun` balas "permission denied for table stasiun" (Postgres
-- 42501), padahal lib/supabase/server.ts pakai service role key. Ini BUKAN soal RLS —
-- service_role sudah otomatis bypass RLS. Ini murni belum ada GRANT tabel/kolom biasa untuk
-- role service_role, yang terjadi kalau tabel dibuat lewat SQL Editor manual tanpa
-- menjalankan grant ini (Supabase tidak selalu grant otomatis ke seluruh tabel baru).
--
-- Wajib dijalankan SETELAH create-view di atas — `all tables in schema public` ikut mencakup
-- view yang baru dibuat (di Postgres, "ALL TABLES IN SCHEMA" juga berarti semua view di
-- schema itu), bukan cuma tabel dasar.
-- ============================================================================
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;
