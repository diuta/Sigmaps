"""Muat Community Activity ke tabel `community_activity`.

    cd etl && source .venv/bin/activate && python load_activity.py

Berkas sumbernya etl/data/activities.geojson (dibuat tarik_mapid.py).

CATATAN KEPEMILIKAN: tabel ini milik Jalur 1 (context-mvp Bagian 5), dipakai
/api/community-sentiment. Skrip ini dibuat Jalur 2 karena cara menariknya sama
persis dengan Menu Go — silakan diambil alih.

PRIVASI — alasan skrip ini pendek:
API mengembalikan user_name, user_full_name, user_profile_picture,
community_picture, dan community_name. Tabelnya SENGAJA tidak punya kolom itu,
jadi kelimanya jatuh di sini tanpa perlu disaring secara eksplisit. Menyaring
sebelum kirim ke Gemini bisa lupa ditulis; tidak menyimpannya sama sekali
membuat kebocoran mustahil. JANGAN menambahkan kolom-kolom itu.
"""

import json

from db import DATA_DIR, butuh_berkas, connect

KOLOM = ["id", "title", "description", "total_comment", "likes", "created_at", "geom"]


def angka(v):
    """Kolomnya integer, tapi API tidak konsisten.

    `likes` dikembalikan sebagai ARRAY OBJEK — dan tiap objeknya memuat
    `user_name`. Yang disimpan hanya JUMLAHNYA; isinya sengaja dibuang di sini
    supaya identitas pemberi like tidak pernah masuk database.
    `total_comment` berupa integer biasa. Keduanya bisa datang kosong.
    """
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
