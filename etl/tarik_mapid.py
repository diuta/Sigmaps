"""Tarik Menu Go dan Properti Go dari API MAPID Competition, simpan mentah.

    cd etl && source .venv/bin/activate
    python tarik_mapid.py

Skrip ini SENGAJA belum tulis ke database. Tugasnya cuma dua:
donlot whatever things ke etl/data/

API MAPID mewajibkan poligon wilayah di body request; tidak ada opsi "kirim
semua". Yang dipakai di sini kotak pembatas DKI Jakarta (opsi A), bukan gabungan
43 isokron, supaya:
Penyaringan ke kawasan dilakukan nanti dengan ST_Within saat pipeline.
"""

import json
import os
import sys
from pathlib import Path

import requests

from db import DATA_DIR, ROOT

KOTAK_DKI = [[
    [106.65, -6.40],
    [107.00, -6.40],
    [107.00, -6.05],
    [106.65, -6.05],
    [106.65, -6.40],
]]

DASAR = "https://server.mapid.io/web/competition"
SUMBER = {
    "menugo": "menugo.geojson",
    "propertigo": "propertigo.geojson",
    "activities": "activities.geojson",
}

# WAJIB dikirim, jangan dihapus.
#
# Endpoint /activities diam-diam membatasi ke jendela waktu terbaru bila
# start_date/end_date tidak diberikan — dan meta.total ikut memantulkan batas
# itu, sehingga angkanya TERLIHAT seperti jumlah sebenarnya. Terukur 7 September
# 2026 pada kotak DKI yang sama:
#     tanpa filter tanggal ....    60
#     Agustus 2026 saja ....... 1.298
#     2015-2030 ............... 1.542
# Tanpa rentang ini, 96% laporan hilang tanpa satu pun pesan galat.
#
# /menugo dan /propertigo TIDAK terpengaruh — keduanya memakai paginasi
# sungguhan (hasMore/limit/offset) dan total-nya tetap 176 dan 191 dengan atau
# tanpa filter. Rentang ini tetap dikirim ke semuanya karena tidak merugikan.
RENTANG_TANGGAL = {"start_date": "2015-01-01", "end_date": "2030-12-31"}

BATAS_HALAMAN = 100

def tarik(nama: str, kunci: str) -> dict:
    url = f"{DASAR}/{nama}"
    headers = {"Content-Type": "application/json", "x-api-key": kunci}
    fitur, offset, halaman = [], 0, 0

    print(f"\nMenarik {nama} ...")
    while True:
        halaman += 1
        if halaman > BATAS_HALAMAN:
            sys.exit(f"{nama}: melewati {BATAS_HALAMAN} halaman, dihentikan. "
                     f"Kemungkinan paginasinya tidak pernah menyatakan selesai.")

        r = requests.post(url, headers=headers,
                          json={"feature": {"type": "Polygon", "coordinates": KOTAK_DKI},
                                "offset": offset,
                                **RENTANG_TANGGAL},
                          timeout=120)
        if r.status_code == 401 or r.status_code == 403:
            sys.exit(f"{nama}: ditolak ({r.status_code}). Periksa MAPID_API_KEY.")
        if r.status_code != 200:
            sys.exit(f"{nama}: galat {r.status_code} pada offset {offset}\n{r.text[:400]}")

        hasil = r.json()

        # Dua bentuk respons yang diketahui dari script.py lama.
        if "features" in hasil:
            batch = hasil["features"]
            fitur.extend(batch)
            p = hasil.get("pagination", {})
            print(f"  halaman {halaman}: +{len(batch)}  (total {len(fitur)})")
            if not p.get("hasMore"):
                break
            offset += p.get("limit", len(batch) or 100)
        elif "data" in hasil and isinstance(hasil["data"], dict):
            kunci_isi = next((k for k, v in hasil["data"].items() if isinstance(v, list)), None)
            if kunci_isi is None:
                sys.exit(f"{nama}: bentuk respons tidak dikenali: {list(hasil['data'])[:8]}")
            batch = hasil["data"][kunci_isi]
            for item in batch:
                fitur.append({
                    "type": "Feature",
                    "geometry": item.get("geometry"),
                    "properties": {k: v for k, v in item.items() if k != "geometry"},
                })
            total = hasil.get("meta", {}).get("total", 0)
            print(f"  halaman {halaman}: +{len(batch)}  (total {len(fitur)} dari {total})")
            if not batch or len(fitur) >= total:
                break
            offset += len(batch)
        else:
            sys.exit(f"{nama}: bentuk respons tidak dikenali: {list(hasil)[:8]}")

    return {"type": "FeatureCollection", "features": fitur}


def laporkan(nama: str, fc: dict) -> None:
    """Laporkan field apa saja yang benar-benar ada, supaya pemetaan tidak menebak."""
    from collections import Counter

    fitur = fc["features"]
    print(f"\n--- {nama}: {len(fitur)} fitur ---")
    if not fitur:
        return

    kunci = Counter()
    for f in fitur:
        kunci.update((f.get("properties") or {}).keys())

    print(f"  {'FIELD':28} {'terisi':>8}  contoh nilai")
    for k, n in kunci.most_common():
        contoh = next((f["properties"][k] for f in fitur
                       if (f.get("properties") or {}).get(k) not in (None, "", {}, [])), None)
        contoh = str(contoh)[:44] if contoh is not None else "(selalu kosong)"
        print(f"  {k:28} {n:5}/{len(fitur):<4} {contoh}")

    geom = Counter((f.get("geometry") or {}).get("type") for f in fitur)
    print(f"  geometri: {dict(geom)}")


def main():
    kunci = os.getenv("MAPID_API_KEY")
    if not kunci:
        sys.exit(f"MAPID_API_KEY belum diisi di {ROOT / '.env.local'}")

    DATA_DIR.mkdir(exist_ok=True)
    for nama, berkas in SUMBER.items():
        fc = tarik(nama, kunci)
        tujuan = DATA_DIR / berkas
        tujuan.write_text(json.dumps(fc, indent=2, ensure_ascii=False), encoding="utf-8")
        laporkan(nama, fc)
        print(f"  disimpan: {tujuan}")

    print("\nBelum ada yang masuk database — itu langkah berikutnya, setelah nama")
    print("fieldnya dipastikan dari laporan di atas.")


if __name__ == "__main__":
    main()
