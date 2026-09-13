export function memoTtl<K, V>(
  fn: (key: K) => Promise<V>,
  ttlMs: number,
  isFailure?: (value: V) => boolean,
): (key: K) => Promise<V> {
  const cache = new Map<K, { promise: Promise<V>; expiresAt: number }>();
  return (key) => {
    const hit = cache.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.promise;
    const evict = () => { if (cache.get(key)?.promise === promise) cache.delete(key); };
    const promise: Promise<V> = fn(key).then(
      (value) => { if (isFailure?.(value)) evict(); return value; },
      (error) => { evict(); throw error; },
    );
    cache.set(key, { promise, expiresAt: Date.now() + ttlMs });
    return promise;
  };
}
