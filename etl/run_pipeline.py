"""Orkestrator pipeline batch — jalankan skrip etl/ secara berurutan, satu perintah.

    cd etl && source .venv/bin/activate && python run_pipeline.py

Dibuat supaya GitHub Actions (atau cron apa pun) punya SATU command untuk
dipanggil, bukan enam. Tiap tahap dijalankan sebagai proses terpisah (persis seperti kalau
dijalankan manual satu-satu) — bukan di-import sebagai modul — supaya galat di
satu tahap tidak mewariskan state Python ke tahap berikutnya, dan exit code tiap
skrip tetap apa adanya.

Berhenti di kegagalan pertama (fail-fast): tahap berikutnya sering bergantung
pada data dari tahap sebelumnya (mis. pipeline_scoring butuh menu_go yang baru
saja dimuat load_mapid), jadi melanjutkan setelah satu tahap gagal cuma
menghasilkan galat kedua yang membingungkan.

SENGAJA TIDAK TERMASUK DI SINI:
  - load_isokron.py   Butuh etl/data/isokron.geojson dari MAPID Isochrone Tool,
                       sebuah berkas yang TIDAK dihasilkan skrip mana pun di
                       pipeline ini. Menjalankannya di jadwal otomatis cuma
                       masuk akal kalau ada proses lain yang menyegarkan
                       berkas itu — sampai saat itu, jalankan manual:
                         python load_isokron.py [path/ke/isokron.geojson]
"""

import subprocess
import sys
import time
from pathlib import Path

ETL_DIR = Path(__file__).resolve().parent

TAHAP = [
    ("Cek koneksi & kondisi database", "cek_koneksi.py"),
    ("Tarik Menu Go / Properti Go / Activities dari MAPID", "tarik_mapid.py"),
    ("Muat Menu Go & Properti Go ke Supabase", "load_mapid.py"),
    ("Ekstrak nomor WhatsApp dari foto_spanduk (OCR)", "extract_phone_spanduk.py"),
    ("Muat Community Activity ke Supabase", "load_activity.py"),
    ("Hitung ulang komponen skor (scored_areas)", "pipeline_scoring.py"),
]


def jalankan(label: str, skrip: str) -> None:
    print(f"\n{'=' * 70}")
    print(f"  {label}")
    print(f"  ({skrip})")
    print("=" * 70)

    sys.stdout.flush()
    mulai = time.monotonic()
    hasil = subprocess.run([sys.executable, str(ETL_DIR / skrip)], cwd=ETL_DIR)
    durasi = time.monotonic() - mulai

    if hasil.returncode != 0:
        print(f"\nGAGAL di tahap '{label}' ({skrip}) setelah {durasi:.1f}s "
              f"— exit code {hasil.returncode}.", file=sys.stderr)
        print("Tahap berikutnya bergantung pada tahap ini, jadi pipeline dihentikan.",
              file=sys.stderr)
        sys.exit(hasil.returncode)

    print(f"\nOK — {durasi:.1f}s")


def main() -> None:
    mulai_total = time.monotonic()
    print(f"Pipeline batch SIGMAPS — {len(TAHAP)} tahap")

    for label, skrip in TAHAP:
        jalankan(label, skrip)

    total = time.monotonic() - mulai_total
    print(f"\n{'=' * 70}")
    print(f"  Semua {len(TAHAP)} tahap selesai — {total:.1f}s total")
    print("=" * 70)


if __name__ == "__main__":
    main()
