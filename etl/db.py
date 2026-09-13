"""Koneksi database bersama untuk seluruh skrip di etl/.

Sengaja cuma satu tempat yang membaca DATABASE_URL — sama semangatnya dengan
aturan CLAUDE.md bagian 5 yang melarang createClient() tersebar di banyak
berkas di sisi Next.js.

CATATAN: ini koneksi milik pipeline batch, TERPISAH dari lib/supabase/server.ts.
Python dan Next.js tidak pernah berbagi koneksi. Satu-satunya jembatan di antara
keduanya adalah tabel di Supabase.
"""

import os
import sys
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = Path(__file__).resolve().parent / "data"

load_dotenv(ROOT / ".env.local")
load_dotenv(ROOT / ".env")

PETUNJUK = {
    "could not translate host name": (
        "Nama host tidak ditemukan. Periksa lagi bagian setelah '@' sampai\n"
        "sebelum ':5432' pada connection string."
    ),
    "nodename nor servname": (
        "Nama host tidak ditemukan. Periksa lagi bagian setelah '@' sampai\n"
        "sebelum ':5432' pada connection string."
    ),
    "Network is unreachable": (
        "Hampir selalu masalah IPv6. Connection string 'Direct connection'\n"
        "Supabase butuh IPv6, sementara sebagian besar jaringan di Indonesia\n"
        "masih IPv4. Pakai 'Session pooler' — pilih dari dropdown di halaman\n"
        "yang sama. Hostnya mengandung kata 'pooler'."
    ),
    "password authentication failed": (
        "Password salah. Yang dipakai adalah password DATABASE (dibuat saat\n"
        "project dibikin), BUKAN service role key.\n"
        "Lupa? Settings > Database > Reset database password.\n"
        "Kalau passwordmu memuat @ : / ? # — karakter itu harus di-URL-encode\n"
        "('@' jadi '%40'). Paling praktis: reset jadi huruf dan angka saja."
    ),
    "Tenant or user not found": (
        "Username pada connection string tidak lengkap. Pada Session pooler\n"
        "bentuknya 'postgres.<ref-project>', bukan 'postgres' saja."
    ),
}


def connect():
    url = os.getenv("DATABASE_URL")
    if not url:
        sys.exit(
            "DATABASE_URL belum diisi.\n\n"
            "Ambil di Supabase: Settings > Database > Connection string > URI,\n"
            "pilih 'Session pooler' (bukan Direct connection).\n"
            f"Tulis sebagai satu baris DATABASE_URL=... di {ROOT / '.env.local'}"
        )
    try:
        return psycopg2.connect(url)
    except psycopg2.Error as e:
        pesan = str(e).strip()
        print(f"GAGAL terhubung ke database.\n\n  {pesan}\n", file=sys.stderr)
        for kunci, saran in PETUNJUK.items():
            if kunci in pesan:
                print(saran, file=sys.stderr)
                break
        sys.exit(1)


def butuh_berkas(path: Path) -> Path:
    if not path.exists():
        sys.exit(f"Berkas tidak ditemukan: {path}\n"
                 f"Salin berkas sumbernya ke {DATA_DIR}/ lebih dulu.")
    return path
