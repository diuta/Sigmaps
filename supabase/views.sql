-- Jalankan sekali di Supabase SQL Editor, urutan atas-ke-bawah, setelah keenam tabel
-- MVP dibuat. Dipanggil lewat supabaseServer.from(view).select(), bukan .rpc().
--
-- Kolom contact_number pada properti_go: nomor WhatsApp hasil OCR (bukan AI generatif)
-- atas foto_spanduk, diisi etl/extract_phone_spanduk.py. Nullable (foto_spanduk sendiri
-- nullable, dan OCR di bawah ambang kepercayaan sengaja tidak diisi — lihat script-nya).
-- Ditulis di sini karena belum ada folder migrasi khusus di project ini, dan ini satu-
-- satunya berkas SQL yang dijalankan manual di SQL Editor.
alter table properti_go add column if not exists contact_number text;

-- Cache OCR untuk extract_phone_spanduk.py — SENGAJA tanpa foreign key ke properti_go(id).
-- load_mapid.py men-delete+insert ulang seluruh properti_go tiap dijalankan (lihat komentar
-- di skrip itu); kalau tabel ini punya FK ke properti_go, delete itu akan gagal (FK restrict)
-- atau cache ini ikut terhapus (FK cascade) — dua-duanya merusak tujuan tabel ini, yaitu
-- BERTAHAN lewat wipe properti_go supaya foto yang tidak berubah tidak perlu di-OCR ulang.
-- Keterkaitan ke properti_go.id murni konvensi (sama string id), bukan constraint database.
create table if not exists properti_go_spanduk_ocr (
  properti_go_id   text primary key,
  contact_number   text,
  ocr_confidence   numeric,
  updated_at       timestamptz not null default now()
);

-- Dua baris di bawah menjamin kolomnya benar APAPUN kondisi tabel saat ini —
-- belum pernah dibuat sama sekali, dibuat dengan create table di atas (tanpa
-- foto_spanduk_url), atau dibuat dari versi awal berkas ini yang sempat menamainya
-- foto_spanduk_hash (sebelum desain cache pindah dari hash-gambar ke URL-foto).
-- Tabelnya selalu kosong di titik ini (skrip yang mengisinya belum pernah sukses
-- jalan), jadi aman drop kolom lama tanpa kehilangan data.
alter table properti_go_spanduk_ocr add column if not exists foto_spanduk_url text;
alter table properti_go_spanduk_ocr drop column if exists foto_spanduk_hash;
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

-- Rute jalan kaki properti -> stasiun, satu baris per pasangan (stasiun, properti) yang
-- muncul di properti_go_by_station. Diisi etl/hitung_rute.py (OSRM profil foot), TIDAK
-- dihitung live. Sengaja tanpa foreign key: properti_go dikosongkan-diisi ulang per
-- `sumber` oleh loader, FK akan ikut menghapus rute yang sebenarnya masih valid.
-- hitung_rute.py yang membersihkan baris yatim.
create table if not exists rute_properti (
  station_id  text not null,
  property_id text not null,
  jarak_m     integer not null,            -- panjang rute di jaringan jalan, meter
  waktu_s     integer not null,            -- durasi jalan kaki, detik (~4,5 km/jam)
  geom        geometry(LineString, 4326) not null,
  engine      text not null,               -- mis. 'osrm-foot'
  computed_at timestamptz not null default now(),
  primary key (station_id, property_id)
);
alter table rute_properti enable row level security;
drop policy if exists "baca publik" on rute_properti;
create policy "baca publik" on rute_properti for select using (true);

-- LEFT JOIN ke rute: pasangan yang belum dihitung tetap tampil dengan
-- jarak/waktu/rute NULL. Itu kondisi normal (hitung_rute.py belum jalan), bukan galat.
create or replace view properti_go_by_station as
select
  a.station_id,
  p.id,
  p.kategori_properti,
  p.jenis_properti,
  p.alamat,
  p.foto_tampak_depan,
  p.foto_spanduk,
  ST_AsGeoJSON(p.geom)::json as geom,
  r.jarak_m  as jarak_jalan_m,
  r.waktu_s  as waktu_jalan_s,
  ST_AsGeoJSON(r.geom)::json as rute
from properti_go p
join scored_areas a on ST_Within(p.geom, a.geom)
left join rute_properti r on r.station_id = a.station_id and r.property_id = p.id;

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
