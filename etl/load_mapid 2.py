"""Muat Menu Go dan Properti Go dari berkas hasil tarik_mapid.py ke Supabase.

    cd etl && source .venv/bin/activate
    python tarik_mapid.py      # tarik dulu, kalau belum
    python load_mapid.py

Aman diulang: tiap tabel dikosongkan lalu diisi ulang dalam satu transaksi.

Urutannya dikunci ke koordinat + nama, bukan urutan balasan API — supaya
menjalankan ulang skrip ini pada data yang sama menghasilkan id yang sama.
"""

import json
import sys

from db import DATA_DIR, butuh_berkas, connect

AMBANG_OBSERVASI = 3
AMBANG_HARGA = 3

HARGA_MIN, HARGA_MAKS = 2000, 150000


def bersihkan_harga(nilai):
    try:
        asli = int(nilai)
    except (TypeError, ValueError):
        return None, None
    bersih = asli * 1000 if asli < 1000 else asli
    if not (HARGA_MIN <= bersih <= HARGA_MAKS):
        bersih = None
    return asli, bersih


def kondisi_pendek(nilai):
    if not nilai:
        return None
    kata = str(nilai).strip().split()[0].strip("(),.")
    return kata if kata in ("Sepi", "Sedang", "Ramai") else None


def baca(berkas):
    fc = json.loads(butuh_berkas(DATA_DIR / berkas).read_text(encoding="utf-8"))
    fitur = [f for f in fc["features"] if (f.get("geometry") or {}).get("type") == "Point"]
    buang = len(fc["features"]) - len(fitur)
    if buang:
        print(f"  {berkas}: {buang} fitur tanpa geometri Point dilewati")
    # Urutan dikunci supaya id-nya stabil antar-jalan.
    fitur.sort(key=lambda f: (f["geometry"]["coordinates"][0],
                              f["geometry"]["coordinates"][1],
                              str((f.get("properties") or {}).get("nama_tempat", ""))))
    return fitur


def muat_menu_go(cur):
    fitur = baca("menugo.geojson")
    rows, tanpa_kondisi, harga_gugur = [], 0, 0
    for i, f in enumerate(fitur, start=1):
        p = f["properties"]
        kondisi = kondisi_pendek(p.get("kondisi_tempat"))
        asli, bersih = bersihkan_harga(p.get("harga_rata_rata"))
        if kondisi is None:
            tanpa_kondisi += 1
        if asli is not None and bersih is None:
            harga_gugur += 1
        rows.append((f"MG-{i}", p.get("nama_tempat"), p.get("jenis_tempat"),
                     kondisi, bersih, asli, json.dumps(f["geometry"])))

    cur.execute("delete from menu_go;")
    cur.executemany(
        """insert into menu_go (id, nama_tempat, jenis_tempat, kondisi_tempat,
                                harga_bersih, harga_asli, geom)
           values (%s, %s, %s, %s, %s, %s, ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326));""",
        rows,
    )
    print(f"menu_go     : {len(rows)} baris")
    if tanpa_kondisi:
        print(f"              {tanpa_kondisi} tanpa kondisi_tempat yang dikenali")
    print(f"              {harga_gugur} harga gugur dari pembersihan "
          f"(pengamatannya tetap dihitung untuk D)")


def muat_properti_go(cur):
    fitur = baca("propertigo.geojson")
    rows = []
    for i, f in enumerate(fitur, start=1):
        p = f["properties"]
        rows.append((f"PG-{i}", p.get("kategori_properti"), p.get("jenis_properti"),
                     p.get("alamat"), p.get("foto_tampak_depan"), p.get("foto_spanduk"),
                     json.dumps(f["geometry"])))

    cur.execute("delete from properti_go;")
    cur.executemany(
        """insert into properti_go (id, kategori_properti, jenis_properti, alamat,
                                    foto_tampak_depan, foto_spanduk, geom)
           values (%s, %s, %s, %s, %s, %s, ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326));""",
        rows,
    )
    print(f"properti_go : {len(rows)} baris")


def main():
    with connect() as conn, conn.cursor() as cur:
        muat_menu_go(cur)
        muat_properti_go(cur)

        print("\n--- Sebaran pengamatan per kawasan (dalam isokron) ---")
        cur.execute(f"""
            select count(*) filter (where n >= {AMBANG_OBSERVASI}) as layak,
                   count(*)                                        as ada_data,
                   (select count(*) from scored_areas)             as total
            from (
              select a.area_id, count(*) as n
              from menu_go m join scored_areas a on ST_Within(m.geom, a.geom)
              group by a.area_id
            ) s;
        """)
        layak, ada, total = cur.fetchone()
        print(f"  {ada} dari {total} kawasan punya pengamatan")
        print(f"  {layak} kawasan mencapai ambang {AMBANG_OBSERVASI} "
              f"-> calon is_rankable")

        cur.execute("""
            select count(*) filter (where a.area_id is not null) as di_dalam,
                   count(*) as total
            from properti_go p left join scored_areas a on ST_Within(p.geom, a.geom);
        """)
        dalam, tot = cur.fetchone()
        print(f"\n  properti: {dalam} dari {tot} berada di dalam isokron")

    print("\nscored_areas belum dihitung — itu langkah pipeline berikutnya.")


if __name__ == "__main__":
    main()
