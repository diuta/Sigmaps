"""Hitung rute jalan kaki properti -> stasiun untuk tiap pasangan di properti_go_by_station,
simpan ke tabel rute_properti (jarak meter, waktu detik, geometri LineString).

Engine: OSRM publik FOSSGIS profil pejalan kaki (routing.openstreetmap.de/routed-foot) —
server yang sama di balik tombol "Directions" openstreetmap.org. Gratis, tanpa key, tapi
untuk pemakaian ringan: skrip ini idempoten (hanya menghitung pasangan yang belum ada)
dan memberi jeda antar-request. Jangan dipanggil dari route.ts — ini kerja batch.

Titik tujuan = koordinat stasiun di tabel `stasiun` (satu titik per stasiun, bukan pintu
masuk). Untuk kios di dalam bangunan stasiun, rute bisa memutar mengikuti pagar/peron
di peta OSM — itu memang "keluar jalur" yang mau ditunjukkan, bukan galat.

Pakai --ulang untuk menghitung ulang semua pasangan (mis. setelah isokron/stasiun berubah).
"""

import json
import ssl
import sys
import time

import requests

from db import connect

if "LibreSSL" in ssl.OPENSSL_VERSION:
    import urllib3.contrib.pyopenssl as _po
    _po.inject_into_urllib3()

OSRM = "https://routing.openstreetmap.de/routed-foot/route/v1/foot/{lon1},{lat1};{lon2},{lat2}"
ENGINE = "osrm-foot"
HEADERS = {"User-Agent": "sigmaps-etl (github.com/sigmaWebgis; batch 1x, pemakaian ringan)"}
JEDA_DETIK = 0.3


def rute(lon1, lat1, lon2, lat2):
    """Balikkan (jarak_m, waktu_s, geojson_linestring) atau None kalau OSRM tidak menemukan rute."""
    url = OSRM.format(lon1=lon1, lat1=lat1, lon2=lon2, lat2=lat2)
    r = requests.get(url, params={"overview": "full", "geometries": "geojson"},
                     headers=HEADERS, timeout=30)
    r.raise_for_status()
    j = r.json()
    if j.get("code") != "Ok" or not j.get("routes"):
        return None
    rt = j["routes"][0]
    if len(rt["geometry"]["coordinates"]) < 2:
        return None
    return round(rt["distance"]), round(rt["duration"]), rt["geometry"]


def main():
    ulang = "--ulang" in sys.argv

    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """delete from rute_properti r
               where not exists (select 1 from properti_go_by_station v
                                 where v.station_id = r.station_id and v.id = r.property_id);"""
        )
        yatim = cur.rowcount
        if ulang:
            cur.execute("delete from rute_properti;")

        cur.execute(
            """select v.station_id, v.id, ST_X(p.geom), ST_Y(p.geom), s.longitude, s.latitude
               from properti_go_by_station v
               join properti_go p on p.id = v.id
               join stasiun s on s.station_id = v.station_id
               where v.rute is null
               order by v.station_id, v.id;"""
        )
        pasangan = cur.fetchall()
        conn.commit()

    print(f"rute yatim dihapus : {yatim}")
    print(f"pasangan dihitung  : {len(pasangan)}" + (" (semua, --ulang)" if ulang else " (yang belum ada)"))
    if not pasangan:
        return

    berhasil = gagal = 0
    with connect() as conn, conn.cursor() as cur:
        for i, (station_id, prop_id, plon, plat, slon, slat) in enumerate(pasangan, 1):
            try:
                hasil = rute(plon, plat, slon, slat)
            except requests.RequestException as e:
                print(f"  [{i}/{len(pasangan)}] {station_id} {prop_id}: GAGAL {e}")
                gagal += 1
                time.sleep(JEDA_DETIK)
                continue
            if hasil is None:
                print(f"  [{i}/{len(pasangan)}] {station_id} {prop_id}: tidak ada rute")
                gagal += 1
                time.sleep(JEDA_DETIK)
                continue
            jarak, waktu, geom = hasil
            cur.execute(
                """insert into rute_properti (station_id, property_id, jarak_m, waktu_s, geom, engine)
                   values (%s, %s, %s, %s, ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326), %s)
                   on conflict (station_id, property_id) do update
                     set jarak_m = excluded.jarak_m, waktu_s = excluded.waktu_s,
                         geom = excluded.geom, engine = excluded.engine, computed_at = now();""",
                (station_id, prop_id, jarak, waktu, json.dumps(geom), ENGINE),
            )
            berhasil += 1
            print(f"  [{i}/{len(pasangan)}] {station_id} {prop_id}: {jarak} m, {waktu // 60} mnt")
            time.sleep(JEDA_DETIK)
        conn.commit()

        cur.execute(
            """select count(*), min(jarak_m), percentile_cont(0.5) within group (order by jarak_m)::int,
                      max(jarak_m)
               from rute_properti;"""
        )
        n, mn, med, mx = cur.fetchone()

    print(f"\nrute_properti : {n} baris (berhasil {berhasil}, gagal {gagal})")
    print(f"jarak m       : min {mn} | median {med} | maks {mx}")


if __name__ == "__main__":
    main()
