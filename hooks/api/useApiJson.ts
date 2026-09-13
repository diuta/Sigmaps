"use client";

/**
 * hooks/api/useApiJson.ts
 * Satu mesin state untuk semua hook fetch di hooks/* (useStations, useProperties,
 * useCommunitySentiment, useAllPropertiesSummary). Tahu bentuk envelope API SIGMAPS
 * (CLAUDE.md §6): sukses `{ data: T }`, gagal `{ error }`.
 *
 * Request di-memo per URL (helper/memo-ttl): beberapa komponen yang memanggil hook yang sama
 * untuk URL yang sama berbagi satu request dan satu objek hasil — termasuk pemanggilan ganda
 * React StrictMode di dev. Hanya respons `ok` yang bertahan di cache.
 *
 * `url === null` berarti "belum perlu ambil": tidak ada request, hasilnya kosong. Saat `url`
 * berganti, `data` langsung `null` dan `loading` `true` sampai jawaban URL baru datang; untuk
 * URL yang sudah di-cache jedanya satu frame.
 */

import { useEffect, useState } from "react";
import { memoTtl } from "@/helper/memo-ttl";

type Envelope = { data: unknown } | { error: string };

const fetchJson = memoTtl(
  (url: string) => fetch(url).then(async (res) => ({ ok: res.ok, json: (await res.json()) as Envelope })),
  10 * 60 * 1000,
  (res) => !res.ok,
);

export function useApiJson<T>(url: string | null, fallbackError: string) {
  const [settled, setSettled] = useState<{ url: string; data: T | null; error: string | null } | null>(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    fetchJson(url)
      .then(({ ok, json }) => {
        if (cancelled) return;
        if (!ok || "error" in json) {
          setSettled({ url, data: null, error: ("error" in json && json.error) || fallbackError });
          return;
        }
        setSettled({ url, data: json.data as T, error: null });
      })
      .catch(() => {
        if (!cancelled) setSettled({ url, data: null, error: fallbackError });
      });

    return () => {
      cancelled = true;
    };
  }, [url, fallbackError]);

  if (!url) return { data: null, loading: false, error: null };

  const current = settled?.url === url ? settled : null;
  return { data: current?.data ?? null, loading: current === null, error: current?.error ?? null };
}
