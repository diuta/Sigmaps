"""Pipeline batch: isi kolom komponen di scored_areas.

    cd etl && source .venv/bin/activate
    python pipeline_scoring.py

Aman diulang — seluruh 43 kawasan dihitung ulang dari nol tiap kali dijalankan.

YANG DIHITUNG DI SINI (dan HANYA ini):
  demand             variabel D, final 0-1
  n_observations     jumlah pengamatan Menu Go di dalam kawasan
  price_median       bahan variabel S
  n_price            jumlah pengamatan yang harganya sah
  competitor_counts  hitungan MENTAH per kategori sensus, bukan 0-1
  total_restaurants  dipakai bila tipe_3 = SEMUA
  is_rankable        n_observations >= 3 AND n_price >= 3

YANG SENGAJA TIDAK DIHITUNG DI SINI:
  C  butuh tipe_3 pengguna, dan normalisasinya butuh sebaran SELURUH kawasan
     pada tipe itu. Mustahil di-precompute.
  S  butuh harga_target pengguna sebagai pembagi.
  skor akhir 0-100  tidak pernah disimpan di tabel mana pun.
Ketiganya dihitung live di lib/scoring.ts saat request.

Seluruh perhitungan dilakukan PostGIS/PostgreSQL, bukan Python. Spatial join,
agregasi, dan persentil memang pekerjaan asli SQL; menariknya ke Python berarti
memindahkan ribuan baris bolak-balik tanpa alasan.
"""

from db import connect

AMBANG_OBSERVASI = 3
AMBANG_HARGA = 3

K = 8
NETRAL = 0.5

UPDATE = f"""
with obs as (
    select a.area_id,
           case m.kondisi_tempat
                when 'Sepi'   then 0.0
                when 'Sedang' then 0.5
                when 'Ramai'  then 1.0
           end as nilai,
           m.harga_bersih
    from menu_go m
    join scored_areas a on ST_Within(m.geom, a.geom)
),
ringkas as (
    select area_id,
           count(nilai)                                             as n_obs,
           avg(nilai)                                               as rata,
           count(harga_bersih)                                      as n_price,
           percentile_cont(0.5) within group (order by harga_bersih) as median
    from obs
    group by area_id
),
pesaing_json as (
    select area_id, jsonb_object_agg(tipe_3, n) as counts, sum(n) as total
    from (
        select a.area_id, r.tipe_3, count(*) as n
        from katalog_restoran r
        join scored_areas a on ST_Within(r.geom, a.geom)
        group by a.area_id, r.tipe_3
    ) x
    group by area_id
)
update scored_areas s set
    n_observations    = coalesce(r.n_obs, 0),
    demand            = (coalesce(r.n_obs, 0) * coalesce(r.rata, {NETRAL}) + {K} * {NETRAL})
                        / (coalesce(r.n_obs, 0) + {K}),
    price_median      = round(r.median)::integer,
    n_price           = coalesce(r.n_price, 0),
    competitor_counts = coalesce(p.counts, '{{}}'::jsonb),
    total_restaurants = coalesce(p.total, 0),
    is_rankable       = coalesce(r.n_obs, 0)   >= {AMBANG_OBSERVASI}
                    and coalesce(r.n_price, 0) >= {AMBANG_HARGA},
    updated_at        = now()
from scored_areas s2
left join ringkas      r on r.area_id = s2.area_id
left join pesaing_json p on p.area_id = s2.area_id
where s.area_id = s2.area_id;
"""


def main():
    with connect() as conn, conn.cursor() as cur:
        cur.execute(UPDATE)
        print(f"{cur.rowcount} kawasan diperbarui.\n")

        cur.execute("""
            select count(*)                                       as total,
                   count(*) filter (where is_rankable)            as rankable,
                   count(*) filter (where price_median is null)   as tanpa_harga,
                   count(*) filter (where total_restaurants = 0)  as tanpa_pesaing,
                   round(min(demand)::numeric, 3),
                   round(max(demand)::numeric, 3),
                   min(total_restaurants), max(total_restaurants)
            from scored_areas;
        """)
        (total, rankable, tanpa_harga, tanpa_pesaing,
         d_min, d_maks, c_min, c_maks) = cur.fetchone()

        print(f"kawasan total          : {total}")
        print(f"is_rankable = true     : {rankable}")
        print(f"tanpa price_median     : {tanpa_harga}")
        print(f"tanpa pesaing sama sekali: {tanpa_pesaing}")
        print(f"total_restaurants      : {c_min} - {c_maks}")
        print(f"demand (D)             : {d_min} - {d_maks}  "
              f"rentang {round(float(d_maks) - float(d_min), 3)}")

        print("\n--- Kawasan yang dapat diperingkat ---")
        cur.execute("""
            select area_id, station_name, n_observations, n_price,
                   round(demand::numeric, 3), price_median, total_restaurants
            from scored_areas where is_rankable
            order by demand desc;
        """)
        print(f"  {'ID':6} {'STASIUN':30} {'obs':>4} {'hrg':>4} "
              f"{'D':>6} {'median':>8} {'pesaing':>8}")
        for r in cur.fetchall():
            print(f"  {r[0]:6} {r[1][:30]:30} {r[2]:4} {r[3]:4} "
                  f"{r[4]:>6} {r[5]:>8} {r[6]:>8}")

        cur.execute("select count(*) from scored_areas where n_price > n_observations;")
        salah = cur.fetchone()[0]
        if salah:
            print(f"\nPERINGATAN: {salah} kawasan punya n_price > n_observations. "
                  f"Itu mustahil — periksa pembersihan harga.")

    print("\nSkor akhir TIDAK disimpan — dihitung live oleh lib/scoring.ts.")


if __name__ == "__main__":
    main()
