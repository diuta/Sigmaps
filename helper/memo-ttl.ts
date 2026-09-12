/**
 * Memoisasi promise per kunci dengan TTL. Yang disimpan promise-nya, jadi pemanggilan yang
 * datang bersamaan untuk kunci yang sama berbagi satu eksekusi `fn`. Promise yang ditolak,
 * atau yang hasilnya dinilai gagal oleh `isFailure`, dibuang supaya pemanggilan berikutnya
 * mencoba lagi. Generik — tidak tahu apa-apa soal SIGMAPS (CLAUDE.md §2b).
 */
export function memoTtl<K, V>(
  fn: (key: K) => Promise<V>,
  ttlMs: number,
  isFailure?: (value: V) => boolean,
): (key: K) => Promise<V> {
  const cache = new Map<K, { promise: Promise<V>; expiresAt: number }>();
  return (key) => {
    const hit = cache.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.promise;
    // Hanya hapus kalau entri masih milik promise ini — jangan menimpa percobaan ulang lain.
    const evict = () => { if (cache.get(key)?.promise === promise) cache.delete(key); };
    const promise: Promise<V> = fn(key).then(
      (value) => { if (isFailure?.(value)) evict(); return value; },
      (error) => { evict(); throw error; },
    );
    cache.set(key, { promise, expiresAt: Date.now() + ttlMs });
    return promise;
  };
}
