"""Muat 43 poligon isokron pejalan kaki 10 menit ke tabel `scored_areas`.

    cd etl && source .venv/bin/activate
    python load_isokron.py [path/ke/isokron.geojson]

Default berkasnya: etl/data/isokron.geojson

Yang diisi skrip ini hanya kerangka kawasan: area_id, station_id, station_name,
geom, area_km2. Kolom komponen (demand, price_median, competitor_counts) tetap
kosong sampai pipeline jalan.

area_km2 dihitung PostGIS dengan ST_Area(geom::geography)
"""

import json
import sys
from pathlib import Path

from db import DATA_DIR, butuh_berkas, connect

PROFIL_WAJIB = "foot"
WAKTU_WAJIB = 600


def main():
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else DATA_DIR / "isokron.geojson"
    fc = json.loads(butuh_berkas(path).read_text(encoding="utf-8"))
    fitur = fc.get("features", [])
    if not fitur:
        sys.exit(f"{path.name}: tidak ada features.")
    print(f"Terbaca {len(fitur)} poligon dari {path.name}")

    rows = []
    for f in fitur:
        p = f["properties"]
        sid = p.get("id_tool")
        if not sid:
            sys.exit(f"Ada fitur tanpa id_tool: {p.get('NAMA')}")

        if p.get("isochrone_profile") != PROFIL_WAJIB or p.get("time_limit") != WAKTU_WAJIB:
            sys.exit(f"{sid}: profil '{p.get('isochrone_profile')}' / "
                     f"{p.get('time_limit')} detik. MVP hanya menerima "
                     f"'{PROFIL_WAJIB}' / {WAKTU_WAJIB} detik.")

        rows.append((sid, sid, json.dumps(f["geometry"]), sid))

    ids = [r[0] for r in rows]
    if len(set(ids)) != len(ids):
        sys.exit("Ada id_tool kembar di berkas GeoJSON.")

    with connect() as conn, conn.cursor() as cur:
        cur.execute("select station_id from stasiun;")
        dikenal = {r[0] for r in cur.fetchall()}
        if not dikenal:
            sys.exit("Tabel stasiun masih kosong — impor CSV stasiun dulu.")

        asing = set(ids) - dikenal
        if asing:
            sys.exit(f"id_tool tidak ada di tabel stasiun: {sorted(asing)}")
        tanpa_isokron = dikenal - set(ids)
        if tanpa_isokron:
            print(f"CATATAN: {len(tanpa_isokron)} stasiun tanpa isokron: "
                  f"{sorted(tanpa_isokron)}")

        cur.execute("delete from scored_areas;")

        cur.executemany(
            """
            insert into scored_areas (area_id, station_id, station_name, geom, area_km2)
            select %s, %s, s.nama, ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326), 0
            from stasiun s
            where s.station_id = %s;
            """,
            rows,
        )

        cur.execute("select count(*) from scored_areas;")
        n = cur.fetchone()[0]
        if n != len(rows):
            sys.exit(f"Hanya {n} dari {len(rows)} baris tersimpan — dibatalkan.")

        cur.execute("update scored_areas set area_km2 = ST_Area(geom::geography) / 1000000;")

        cur.execute("""
            select count(*),
                   round(min(area_km2)::numeric, 3),
                   round(percentile_cont(0.5) within group (order by area_km2)::numeric, 3),
                   round(max(area_km2)::numeric, 3),
                   count(*) filter (where not ST_IsValid(geom)),
                   count(distinct ST_GeometryType(geom))
            from scored_areas;
        """)
        n, kecil, tengah, besar, rusak, jenis = cur.fetchone()

    print(f"\nTersimpan {n} kawasan.")
    print(f"Luas km2 : min {kecil} | median {tengah} | maks {besar}")
    print(f"           (harapan: 0,495 | 1,063 | 1,587)")

    if rusak:
        print(f"\nPERINGATAN: {rusak} poligon tidak valid. Geometri rusak lolos insert "
              f"tapi membuat ST_Within diam-diam meleset.")
    if jenis != 1:
        print(f"PERINGATAN: ada {jenis} jenis geometri berbeda, harusnya semua ST_Polygon.")

    print("\nKolom komponen masih kosong — itu isi pipeline berikutnya.")
    print("Jalur 1 dan Jalur 3 sudah bisa menggambar 43 kawasan mulai sekarang.")


if __name__ == "__main__":
    main()
