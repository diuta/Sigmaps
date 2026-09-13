"""Periksa koneksi ke Supabase dan kondisi database. TIDAK menulis apa pun.

    cd etl && source .venv/bin/activate && python cek_koneksi.py

    INI CUMA UNTUK CEK KONEKSI DAN KONDISI DATABASE YEEE
"""

from db import connect

TABEL = ["stasiun", "scored_areas", "katalog_restoran", "menu_go",
         "properti_go", "community_activity"]

HARAPAN = {"stasiun": 43, "scored_areas": 43, "katalog_restoran": 6392}


def main():
    with connect() as conn, conn.cursor() as cur:
        cur.execute("select current_database(), current_user, version();")
        db, user, versi = cur.fetchone()
        print(f"Terhubung  : {db} sebagai {user}")
        print(f"PostgreSQL : {versi.split(',')[0].replace('PostgreSQL ', '')}")

        cur.execute("select extversion from pg_extension where extname = 'postgis';")
        pg = cur.fetchone()
        print(f"PostGIS    : {pg[0] if pg else 'BELUM AKTIF'}")

        cur.execute("select tablename, rowsecurity from pg_tables where schemaname = 'public';")
        ada = dict(cur.fetchall())
        cur.execute("select tablename, count(*) from pg_policies "
                    "where schemaname = 'public' group by 1;")
        policy = dict(cur.fetchall())

        print(f"\n{'TABEL':20} {'RLS':>5} {'POLICY':>7} {'BARIS':>8} {'HARAPAN':>9}")
        print("-" * 54)
        hilang, belum = [], []
        for t in TABEL:
            if t not in ada:
                print(f"{t:20} {'-':>5} {'-':>7} {'-':>8} {HARAPAN.get(t, '-'):>9}")
                hilang.append(t)
                continue
            cur.execute(f"select count(*) from {t};")
            n = cur.fetchone()[0]
            h = HARAPAN.get(t)
            tanda = ""
            if h is not None and n != h:
                tanda = "  <-"
                belum.append(t)
            if ada[t] and policy.get(t, 0) == 0:
                tanda += "  RLS aktif tanpa policy"
            print(f"{t:20} {'ya' if ada[t] else 'TIDAK':>5} {policy.get(t, 0):>7} "
                  f"{n:>8} {str(h) if h else '-':>9}{tanda}")

        if "katalog_restoran" in ada:
            cur.execute("select count(*) from katalog_restoran where geom is null;")
            kosong = cur.fetchone()[0]
            if kosong:
                print(f"\nPERINGATAN: {kosong} baris katalog_restoran tanpa geom.")

        if "scored_areas" in ada:
            cur.execute("select count(*) from scored_areas where not ST_IsValid(geom);")
            rusak = cur.fetchone()[0]
            if rusak:
                print(f"PERINGATAN: {rusak} poligon scored_areas tidak valid.")

    print()
    if hilang:
        print(f"Tabel belum ada: {', '.join(hilang)}")
    elif belum:
        print(f"Tabel sudah ada, datanya belum lengkap: {', '.join(belum)}")
    else:
        print("Koneksi dan data sesuai harapan.")


if __name__ == "__main__":
    main()
