"""Tarik daftar aset komersial stasiun dari KAI Space (space.kai.id) ke etl/data/kai_space.json.

Token "space.kai.id" bukan rahasia — ini nilai statis yang dipakai situs publiknya sendiri.
"""

import json

import requests

from db import DATA_DIR

URL = "https://space-api.kai.id/api/v1/komersialasetram"
HEADERS = {"Authorization": "Bearer space.kai.id", "Accept": "application/json"}


def main():
    r = requests.get(URL, headers=HEADERS, timeout=60)
    r.raise_for_status()
    aset = r.json()
    aset = aset.get("data", aset) if isinstance(aset, dict) else aset

    DATA_DIR.mkdir(exist_ok=True)
    tujuan = DATA_DIR / "kai_space.json"
    tujuan.write_text(json.dumps(aset, ensure_ascii=False, indent=1))
    print(f"kai_space.json : {len(aset)} aset -> {tujuan}")


if __name__ == "__main__":
    main()
