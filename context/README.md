> ⚠️ **Duplikat kedaluwarsa.** Versi yang berlaku ada di `docs/README.md` — berkas ini masih
> menyebut path sebelum refactor (`lib/scoring.ts`, `lib/tipe3.ts`, `lib/stations.ts`) dan
> belum diperbarui untuk perubahan skoring di merge `bb4c280`. Belum dihapus karena
> pembagian `docs/` vs `context/` masih menunggu keputusan tim — lihat `docs/README.md`.

# docs/

Folder ini isinya dokumentasi **cara pakai** tiap fitur (bukan keputusan produk — itu di
`context/context-final.md`, dan bukan aturan arsitektur — itu di `CLAUDE.md` root).

**Aturan lengkap ada di `CLAUDE.md` bagian "Dokumentasi fitur"** — ringkasnya:

- Satu file per fitur, nama: `<nama-fitur-kebab-case>.md`.
- Wajib ada begitu fitur baru (endpoint API, komponen, modul `lib/`) selesai dibuat.
- Isi minimal: apa fungsinya, cara pakai (contoh nyata), dependency/prasyarat, batasan/gotcha.

Kalau folder ini masih kosong (belum ada file selain README ini), berarti belum ada fitur
yang didokumentasikan — bukan berarti dokumentasinya opsional.
