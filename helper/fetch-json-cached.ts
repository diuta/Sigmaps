/**
 * `fetch()` JSON GET dengan dua tambahan: permintaan yang sedang berjalan untuk URL yang sama
 * dibagi (dedup), dan respons sukses disimpan sementara per URL.
 *
 * Generik — tidak tahu apa-apa soal SIGMAPS maupun bentuk envelope-nya, cocok di helper/
 * (CLAUDE.md §2b). Bentuk `{ data } | { error }` ditafsirkan pemanggil (hooks/api/useApiJson).
 *
 * Kenapa ada: beberapa komponen memanggil hook fetch yang sama untuk URL yang sama saat mount
 * (tiga pemanggil `useStations()` di halaman awal, dua pemanggil `useProperties(id)` tiap klik
 * stasiun), dan tiap pemanggil dulu menembak request-nya sendiri. Dengan memoisasi PROMISE per
 * URL, pemanggil kedua dan seterusnya menumpang request pertama — termasuk pemanggilan ganda
 * dari React StrictMode di dev.
 *
 * Hanya respons `res.ok` yang bertahan di cache. Respons gagal (4xx/5xx), body bukan JSON, dan
 * galat jaringan dibuang dari cache begitu selesai supaya pemanggil berikutnya mencoba lagi.
 */

export interface JsonResponse<T> {
  ok: boolean;
  status: number;
  json: T;
}

interface Entry {
  promise: Promise<JsonResponse<unknown>>;
  expiresAt: number;
}

const cache = new Map<string, Entry>();

const DEFAULT_TTL_MS = 10 * 60 * 1000;

export function fetchJsonCached<T = unknown>(
  url: string,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<JsonResponse<T>> {
  const hit = cache.get(url);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.promise as Promise<JsonResponse<T>>;
  }

  const evictIfOwner = () => {
    // Hanya hapus kalau entri di cache masih milik promise ini — jangan menimpa percobaan
    // ulang yang sudah dimulai pemanggil lain.
    if (cache.get(url)?.promise === promise) cache.delete(url);
  };

  const promise: Promise<JsonResponse<T>> = fetch(url)
    .then(async (res) => ({ ok: res.ok, status: res.status, json: (await res.json()) as T }))
    .then((result) => {
      if (!result.ok) evictIfOwner();
      return result;
    })
    .catch((error) => {
      evictIfOwner();
      throw error;
    });

  cache.set(url, { promise, expiresAt: Date.now() + ttlMs });
  return promise;
}

/** Kosongkan seluruh cache — untuk pengujian atau pemuatan ulang manual. */
export function clearFetchJsonCache(): void {
  cache.clear();
}
