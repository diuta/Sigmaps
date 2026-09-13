"""Muat aset KAI Space (etl/data/kai_space.json) ke tabel properti_go dengan sumber = 'kai_space'.

Hanya aset yang berada DI DALAM salah satu isokron stasiun (scored_areas) yang dimuat —
sama dengan definisi "dekat stasiun" yang dipakai view properti_go_by_station. Penyaringan
dilakukan PostGIS (ST_Within), bukan lewat nama kota. Jadi load_isokron.py wajib sudah jalan.

Pemetaan kolom (yang tidak punya padanan dibiarkan null):
  id                -> "KAI-<blokid>"
  kategori_properti -> "Lahan Stasiun" bila jenisaset lahan/tanah, selain itu "Kios Stasiun"
  jenis_properti    -> "Disewa" bila masih tersedia, "Sudah Tersewa" bila rented = true
  alamat            -> "<namablok> - <namalokasi>, <kabupatenkota>"
  foto_tampak_depan -> https://space-api.kai.id/proxy?guid=<fotos[0]>, null bila tidak ada foto
  foto_spanduk      -> null (KAI tidak punya padanan)
  geom              -> titik dari longitude/latitude

Aset non-ruang (iklan, ATM, vending, loket) dan yang tidak punya koordinat dilewati.
"""

import json

from db import DATA_DIR, butuh_berkas, connect

FOTO_URL = "https://space-api.kai.id/proxy?guid={}"
BUKAN_RUANG = ("IKLAN", "STICKER", "STIKER", "BILLBOARD", "ATM", "VENDING", "LOKET",
               "BRANDING", "DINDING", "LED", "VIDEOTRON", "BANNER")


def kategori(jenis):
    j = (jenis or "").upper()
    return "Lahan Stasiun" if "LAHAN" in j or "TANAH" in j else "Kios Stasiun"


def alamat(a):
    bagian = [a.get("namablok"), a.get("namalokasi"), a.get("kabupatenkota")]
    bagian = [b.strip() for b in bagian if b and b.strip()]
    return " - ".join(bagian[:2]) + (f", {bagian[2]}" if len(bagian) > 2 else "") if bagian else None


def foto(a):
    fotos = a.get("fotos") or []
    return FOTO_URL.format(fotos[0]) if fotos else None


def layak(a):
    teks = f"{a.get('namablok', '')} {a.get('jenisaset', '')}".upper()
    if any(k in teks for k in BUKAN_RUANG):
        return False
    return a.get("latitude") is not None and a.get("longitude") is not None


def main():
    berkas = butuh_berkas(DATA_DIR / "kai_space.json")  # hasil tarik_kai.py
    aset = json.loads(berkas.read_text())

    rows = [
        (f"KAI-{a['blokid']}", kategori(a.get("jenisaset")),
         "Sudah Tersewa" if a.get("rented") else "Disewa", alamat(a),
         foto(a), None, float(a["longitude"]), float(a["latitude"]))
        for a in aset if layak(a)
    ]

    with connect() as conn, conn.cursor() as cur:
        # Tampung semua kandidat dulu, lalu ambil hanya yang jatuh di dalam isokron.
        cur.execute(
            """create temp table kai_kandidat (
                 id text, kategori_properti text, jenis_properti text, alamat text,
                 foto_tampak_depan text, foto_spanduk text, geom geometry(Point, 4326));"""
        )
        cur.executemany(
            """insert into kai_kandidat
               values (%s, %s, %s, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326));""",
            rows,
        )
        cur.execute("delete from properti_go where sumber = 'kai_space';")
        cur.execute(
            """insert into properti_go (id, kategori_properti, jenis_properti, alamat,
                                        foto_tampak_depan, foto_spanduk, geom, sumber)
               select k.id, k.kategori_properti, k.jenis_properti, k.alamat,
                      k.foto_tampak_depan, k.foto_spanduk, k.geom, 'kai_space'
               from kai_kandidat k
               where exists (select 1 from scored_areas a where ST_Within(k.geom, a.geom));"""
        )
        dimuat = cur.rowcount
        cur.execute(
            """select s.nama, count(*)
               from properti_go p
               join scored_areas a on ST_Within(p.geom, a.geom)
               join stasiun s on s.station_id = a.station_id
               where p.sumber = 'kai_space'
               group by s.nama order by 2 desc;"""
        )
        per_stasiun = cur.fetchall()
        conn.commit()

    print(f"properti_go (kai_space) : {dimuat} baris dari {len(rows)} kandidat ({len(aset)} aset)")
    for nama, n in per_stasiun:
        print(f"  {nama:<32} {n}")


if __name__ == "__main__":
    main()
