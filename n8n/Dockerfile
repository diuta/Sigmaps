# Image n8n + Python, supaya node "Execute Command" di n8n bisa langsung
# menjalankan etl/run_pipeline.py di kontainer yang sama — tanpa kontainer etl
# terpisah, tanpa bind-mount Docker socket host (pola "docker-outside-of-docker"
# itu bekerja, tapi path bind-mount yang dilihat daemon HOST gampang meleset
# dari path di dalam kontainer n8n; dihindari sama sekali di sini).
#
# DUA TAHAP, BUKAN SATU — ditemukan lewat build & jalan asli, bukan cuma baca
# dokumentasi:
#   1. Image n8n resmi sekarang "Docker Hardened Image" (Alpine tanpa package
#      manager sama sekali, `apk` tidak ada) — jadi Python wajib disiapkan di
#      tempat lain lalu di-copy masuk.
#   2. Percobaan pertama pakai `python -m venv` GAGAL saat benar-benar
#      dijalankan: venv cuma menyimpan SYMLINK ke python sistem
#      (/opt/venv/bin/python3 -> /usr/local/bin/python3), bukan salinan
#      sungguhan — begitu venv-nya di-copy sendirian ke image n8n (yang tidak
#      punya /usr/local/bin/python3 sama sekali), symlink itu jadi dangling.
#      Perbaikannya: copy INTERPRETER LENGKAPNYA (biner + libpython.so +
#      stdlib) dari image build, bukan cuma folder venv.

# --- Tahap 1: instal dependency etl/ langsung ke site-packages Python sistem ---
# python:3.12-alpine dipilih (bukan -slim/Debian) supaya musl libc-nya cocok
# dengan Alpine di image n8n tahap 2 — ekstensi C seperti psycopg2 di-compile
# untuk satu ABI musl tertentu, tidak portable ke glibc atau musl versi lain.
# --target langsung ke site-packages resmi supaya nempel begitu saja saat
# /usr/local/lib/python3.12 di-copy utuh ke tahap 2 (tidak perlu PYTHONPATH
# tambahan, dan tidak kena batasan PEP 668 "externally-managed-environment"
# yang berlaku untuk instalasi biasa, bukan --target).
FROM python:3.12-alpine AS python-build

RUN apk add --no-cache gcc musl-dev postgresql-dev

COPY etl/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir --target=/usr/local/lib/python3.12/site-packages \
    -r /tmp/requirements.txt

# --- Tahap 2: image n8n asli, tempel interpreter Python lengkap + kode etl/ ---
# Versi DIPIN, bukan :latest — n8n 2.x mengubah default yang memengaruhi setup
# ini (mis. NODES_EXCLUDE, lihat docker-compose.yml); lompatan major diam-diam
# lewat :latest bisa mematikan workflow tanpa ada yang mengubah repo. Naikkan
# versi dengan sengaja, lalu tes `docker compose exec n8n n8n execute --id ...`.
#
# Ditarik dari Docker Hub (docker.io/n8nio/n8n), bukan docker.n8n.io yang
# dipakai dokumentasi n8n: docker.n8n.io cuma proxy ke Docker Hub, dan batas
# tarik anonim Docker Hub dihitung per IP egress proxy itu (dibagi ramai-ramai
# semua pengguna n8n) — build di sini pernah macet lama dengan
# "429 Too Many Requests" dari docker.n8n.io. Image-nya identik.
FROM n8nio/n8n:2.38.7

USER root

# Ketiga potongan ini WAJIB tiga-tiganya, dari image build yang SAMA (arsitektur
# & musl ABI harus persis sama dengan lib yang dipakai python3.12 tautan
# dinamis di bawah):
#   - biner interpreter
#   - libpython3.12.so.1.0 (python3.12 TIDAK statis, wajib ada ini di runtime)
#   - stdlib + site-packages (sudah termasuk psycopg2/dotenv/requests dari tahap 1)
COPY --from=python-build /usr/local/bin/python3.12 /opt/python/bin/python3.12
COPY --from=python-build /usr/local/lib/libpython3.12.so.1.0 /opt/python/lib/libpython3.12.so.1.0
COPY --from=python-build /usr/local/lib/python3.12 /opt/python/lib/python3.12
ENV PYTHONHOME=/opt/python
ENV LD_LIBRARY_PATH=/opt/python/lib
# /opt/python/bin di depan PATH supaya `python3` ketemu dari mana pun — node
# Execute Command di n8n maupun `docker compose exec n8n python3 ...`. Path
# absolut /opt/python/bin/python3 tetap dipakai di workflow JSON supaya tidak
# bergantung PATH sama sekali; ini cuma kenyamanan.
ENV PATH=/opt/python/bin:$PATH
RUN ln -s /opt/python/bin/python3.12 /opt/python/bin/python3 \
    && ln -s /opt/python/bin/python3.12 /opt/python/bin/python

# Skrip etl/ dibekukan ke image saat build. Kalau skripnya sering berubah,
# jalankan `docker compose build n8n` ulang — lihat docs/etl-n8n-automation.md.
#
# --chown=node:node WAJIB: kontainer n8n jalan sebagai user `node` (uid 1000),
# bukan root (lihat `USER node` di bawah). Tanpa ini /app/etl milik root, dan
# tarik_mapid.py gagal nulis etl/data/*.geojson saat benar-benar dijalankan
# (baru ketahuan lewat tes langsung, bukan baca kode — py_compile juga sempat
# gagal nulis __pycache__ dengan gejala yang sama).
#
# Apa saja dari etl/ yang TIDAK ikut (dupe " 2", fixture lama, data/, .venv)
# diatur di .dockerignore ROOT repo — bukan etl/.dockerignore, karena konteks
# build-nya root (`context: .` di docker-compose.yml) dan Docker cuma membaca
# .dockerignore di root konteks.
COPY --chown=node:node etl/ /app/etl/

USER node
