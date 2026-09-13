"""Ekstrak nomor WhatsApp dari foto_spanduk pakai OCR (PaddleOCR), TANPA AI generatif.

    cd etl && source .venv/bin/activate
    python extract_phone_spanduk.py

Jalan setelah load_mapid.py (butuh kolom foto_spanduk sudah terisi). properti_go
di-delete+insert ulang tiap kali load_mapid.py jalan (lihat komentar di sana), jadi
contact_number IKUT TERHAPUS tiap pipeline run — skrip ini menulisnya ulang setiap
kali dari cache di properti_go_spanduk_ocr (lihat supabase/views.sql), tabel terpisah
yang TIDAK ikut terhapus karena bukan properti_go dan sengaja tanpa foreign key ke
sana. Cache di-kunci per properti_go_id + URL foto_spanduk saat ini:
  - URL sama dengan yang tersimpan di cache -> foto tidak berubah, contact_number
    ditulis ulang dari cache TANPA download atau OCR ulang.
  - URL beda (atau belum ada di cache)      -> download + OCR seperti biasa, cache
    diperbarui dengan URL & hasil yang baru.
Nama file dari MAPID CDN memuat timestamp upload (contoh:
".../1787642691406_stamped_1787642690096.jpg"), jadi berasumsi URL berubah kalau
fotonya diganti itu wajar untuk sumber ini — bukan jaminan umum tiap CDN.

Nomor HANYA ditulis kalau confidence pengenalan PaddleOCR >= AMBANG_KEPERCAYAAN.
Di bawah itu, atau kalau tidak ada pola nomor valid ditemukan, contact_number
dibiarkan NULL — bukan ditulis dengan tebakan berkualitas rendah. Ini penting:
nomor ini dipakai orang asing menghubungi pemilik lewat WhatsApp, satu digit salah
baca (OCR sering keliru 8/3, 0/8, 1/7) menghasilkan nomor yang salah tapi
kelihatan valid, bukan kegagalan yang jelas.

Commit per baris (bukan satu transaksi besar di akhir): kalau skrip terhenti di
tengah (mati listrik, koneksi putus, dsb), baris yang sudah diproses TETAP
tersimpan — dijalankan ulang cuma memproses sisanya (atau malah dari cache kalau
fotonya sama).
"""

import re

import cv2
import numpy as np
import phonenumbers
import requests
from paddleocr import PaddleOCR

from db import connect

# Ambang konservatif: string angka tidak seperti kalimat, satu salah baca merusak
# seluruh nomor, dan nomor ini dipakai kontak langsung ke orang asing — bukan
# label yang salahnya cuma kelihatan aneh. Turunkan ke ~0.85 kalau setelah dites
# di foto asli ternyata kebanyakan nomor sah malah tertolak.
AMBANG_KEPERCAYAAN = 0.90

POLA_NOMOR = re.compile(r"(?:\+?62|0)8[0-9]{8,11}")

_ocr = None


def ocr_engine() -> PaddleOCR:
    # Lazy: supaya "python extract_phone_spanduk.py --help" atau import untuk test
    # tidak wajib mengunduh model (~ratusan MB) lebih dulu.
    # PaddleOCR 3.x: constructor tidak lagi menerima use_angle_cls/show_log (API 2.x
    # lama), dan pemanggilannya lewat .predict() bukan .ocr(..., cls=True) — dicek
    # langsung terhadap paddleocr terpasang (3.7.0) sebelum menulis ini.
    global _ocr
    if _ocr is None:
        _ocr = PaddleOCR(lang="en")
    return _ocr


def unduh_gambar(url: str) -> bytes:
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    return resp.content


def baca_teks(gambar_bytes: bytes) -> list[tuple[str, float]]:
    arr = np.frombuffer(gambar_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("gagal decode gambar (format tidak dikenali/rusak)")

    # .predict() menerima array BGR langsung (dites terhadap paddleocr 3.7.0 asli,
    # bukan diasumsikan dari dokumentasi versi lama). Tiap elemen hasil adalah
    # OCRResult dict-like dengan rec_texts/rec_scores sejajar index.
    hasil = ocr_engine().predict(img)
    baris = []
    for halaman in hasil:
        teks_list = halaman.get("rec_texts", [])
        skor_list = halaman.get("rec_scores", [])
        baris.extend(zip(teks_list, skor_list))
    return baris


def ekstrak_nomor(baris: list[tuple[str, float]]) -> tuple[str, float] | None:
    terbaik = None
    for teks, confidence in baris:
        if confidence < AMBANG_KEPERCAYAAN:
            continue
        angka_saja = re.sub(r"[\s\-.()]", "", teks)
        cocok = POLA_NOMOR.search(angka_saja)
        if not cocok:
            continue
        try:
            parsed = phonenumbers.parse(cocok.group(), "ID")
            if not phonenumbers.is_valid_number(parsed):
                continue
        except phonenumbers.NumberParseException:
            continue
        ternormalisasi = phonenumbers.format_number(
            parsed, phonenumbers.PhoneNumberFormat.E164
        )
        if terbaik is None or confidence > terbaik[1]:
            terbaik = (ternormalisasi, confidence)
    return terbaik


def proses_baris(foto_spanduk: str) -> tuple[str | None, float | None, str]:
    try:
        gambar_bytes = unduh_gambar(foto_spanduk)
        baris = baca_teks(gambar_bytes)
    except Exception as e:
        return None, None, f"gagal ({e})"

    hasil = ekstrak_nomor(baris)
    if hasil is None:
        return None, None, "tidak ditemukan / di bawah ambang"

    nomor, confidence = hasil
    return nomor, confidence, f"OK confidence={confidence:.2f}"


def ambil_cache(cur) -> dict[str, tuple[str, str | None, float | None]]:
    cur.execute(
        "select properti_go_id, foto_spanduk_url, contact_number, ocr_confidence "
        "from properti_go_spanduk_ocr;"
    )
    return {row[0]: (row[1], row[2], row[3]) for row in cur.fetchall()}


def simpan_cache(cur, row_id: str, foto_spanduk: str, nomor: str | None, confidence: float | None) -> None:
    cur.execute(
        """insert into properti_go_spanduk_ocr
               (properti_go_id, foto_spanduk_url, contact_number, ocr_confidence, updated_at)
           values (%s, %s, %s, %s, now())
           on conflict (properti_go_id) do update set
               foto_spanduk_url = excluded.foto_spanduk_url,
               contact_number = excluded.contact_number,
               ocr_confidence = excluded.ocr_confidence,
               updated_at = now();""",
        (row_id, foto_spanduk, nomor, confidence),
    )


def tulis_contact_number(cur, row_id: str, nomor: str | None) -> None:
    cur.execute(
        "update properti_go set contact_number = %s where id = %s;", (nomor, row_id)
    )


def main() -> None:
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            "select id, foto_spanduk from properti_go where foto_spanduk is not null;"
        )
        baris_properti = cur.fetchall()
        cache = ambil_cache(cur)

        dari_cache, terisi_baru, kosong, gagal = 0, 0, 0, 0
        for row_id, foto_spanduk in baris_properti:
            entri_cache = cache.get(row_id)

            if entri_cache is not None and entri_cache[0] == foto_spanduk:
                nomor = entri_cache[1]
                tulis_contact_number(cur, row_id, nomor)
                conn.commit()
                dari_cache += 1
                print(f"  {row_id}: dari cache (foto tidak berubah) -> {nomor!r}")
                continue

            nomor, confidence, status = proses_baris(foto_spanduk)
            print(f"  {row_id}: {status}")

            tulis_contact_number(cur, row_id, nomor)
            simpan_cache(cur, row_id, foto_spanduk, nomor, confidence)
            conn.commit()

            if nomor is not None:
                terisi_baru += 1
            elif "gagal" in status:
                gagal += 1
            else:
                kosong += 1

        print(
            f"\nextract_phone_spanduk: {len(baris_properti)} properti punya foto_spanduk"
            f" -> {dari_cache} dari cache, {terisi_baru} baru di-OCR & terisi,"
            f" {kosong} kosong (di bawah ambang/tidak ditemukan), {gagal} gagal diproses"
        )


if __name__ == "__main__":
    main()
