"""Muat Community Activity dari etl/data/activities.geojson ke tabel community_activity.

    python load_activity.py

PRIVASI: API mengembalikan user_name, user_full_name, user_profile_picture,
community_picture. Tabelnya sengaja tidak punya kolom itu, jadi semuanya jatuh
di sini. JANGAN menambahkan kolom-kolom itu.
"""

import json

from db import DATA_DIR, butuh_berkas, connect

KOLOM = ["id", "title", "description", "total_comment", "likes", "created_at", "geom"]


def angka(v):
    """`likes` datang sebagai array objek berisi user_name — simpan jumlahnya saja."""
    if isinstance(v, list):
        return len(v)
    try:
        return int(v)
    except (TypeError, ValueError):
        return 0


def main():
    fc = json.loads(butuh_berkas(DATA_DIR / "activities.geojson").read_text(encoding="utf-8"))
    fitur = [f for f in fc["features"] if (f.get("geometry") or {}).get("type") == "Point"]
    if len(fitur) != len(fc["features"]):
        print(f"{len(fc['features']) - len(fitur)} fitur tanpa geometri Point dilewati")

    rows = [
        (
            p.get("_id"),
            p.get("title"),
            p.get("description"),
            angka(p.get("total_comment")),
            angka(p.get("likes")),
            p.get("created_at") or None,
            json.dumps(f["geometry"]),
        )
        for f in fitur
        for p in [f["properties"]]
    ]

    with connect() as conn, conn.cursor() as cur:
        cur.execute("delete from community_activity;")
        cur.executemany(
            f"""insert into community_activity ({', '.join(KOLOM)})
                values (%s, %s, %s, %s, %s, %s, ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326));""",
            rows,
        )
        print(f"community_activity : {len(rows)} baris")

        # Berapa yang benar-benar bisa diringkas per kawasan? Ini yang menentukan
        # apakah /api/community-sentiment punya bahan atau tidak.
        cur.execute("""
            select count(*) filter (where a.area_id is not null) as di_dalam,
                   count(distinct a.area_id)                     as kawasan
            from community_activity c
            left join scored_areas a on ST_Within(c.geom, a.geom);
        """)
        dalam, kawasan = cur.fetchone()
        print(f"  {dalam} dari {len(rows)} berada di dalam isokron, tersebar di "
              f"{kawasan} dari 43 kawasan")

        cur.execute("""
            select a.station_name, count(*) as n
            from community_activity c
            join scored_areas a on ST_Within(c.geom, a.geom)
            group by 1 order by n desc;
        """)
        hasil = cur.fetchall()
        if hasil:
            print("\n  laporan per kawasan:")
            for nama, n in hasil:
                print(f"    {nama[:34]:34} {n:3}")


if __name__ == "__main__":
    main()
