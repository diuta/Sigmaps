-- Jalankan sekali di Supabase SQL Editor, urutan atas-ke-bawah, setelah keenam tabel
-- MVP dibuat. Dipanggil lewat supabaseServer.from(view).select(), bukan .rpc().
--
-- View dipakai HANYA untuk dua hal yang memang tidak bisa lewat query builder:
--   1. Spatial join ST_Within (properti_go / community_activity / scored_areas)
--   2. Konversi kolom geometry ke GeoJSON — PostgREST membalas WKB hex
-- Plus satu pengecualian: DISTINCT untuk tipe3_values.
--
-- Pemakainya:
--   properti_go_by_station        -> app/api/properties/route.ts
--   community_activity_by_station -> app/api/community-sentiment/route.ts
--   stasiun_kawasan               -> app/api/stations/route.ts
--   tipe3_values                  -> lib/tipe3 (prompt-request & score)
drop view if exists stasiun_geojson;

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

-- Titik stasiun + isokron + penanda is_rankable, satu baris per stasiun.
-- Dipakai app/api/stations/route.ts.
--
-- Butuh view karena alasan nomor 2 di atas: `isokron` berasal dari scored_areas.geom,
-- kolom geometry PostGIS, dan PostgREST membalasnya sebagai WKB hex.
--
-- LEFT JOIN: kalau pipeline batch belum jalan, stasiunnya tetap tampil dengan
-- isokron/area_km2/is_rankable NULL. Itu kondisi normal, bukan galat.
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

-- Sumber tunggal daftar TIPE_3 — wajib dari query, jangan diketik manual (§6.8b),
-- supaya enum kode dan isi tabel tidak diam-diam berbeda. Butuh view karena
-- PostgREST tidak bisa menyatakan DISTINCT. ORDER BY kosmetik; lib/tipe3 mengurutkan
-- ulang di klien.
create or replace view tipe3_values as
select distinct tipe_3 from katalog_restoran order by tipe_3;

-- GRANT wajib untuk service_role. Tanpa ini query balas "permission denied"
-- (Postgres 42501) walau pakai service role key — bukan soal RLS, tapi GRANT tabel
-- yang belum ada saat tabel dibuat manual lewat SQL Editor.
-- Jalankan SETELAH create-view: "all tables in schema" mencakup view juga.
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;
