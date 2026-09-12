"use client";

/**
 * hooks/api/useApiJson.ts
 * Satu mesin state untuk semua hook fetch di hooks/* (useStations, useProperties,
 * useCommunitySentiment, useAllPropertiesSummary). Dulu keempatnya menyalin pola yang sama
 * (`cancelled` + data/loading/error) dan masing-masing menembak request sendiri.
 *
 * Tahu bentuk envelope API SIGMAPS (CLAUDE.md §6): sukses `{ data: T }`, gagal `{ error }`.
 * Transport + cache-nya di helper/fetch-json-cached.ts (generik).
 *
 * `url === null` berarti "belum perlu ambil": tidak ada request, hasilnya kosong.
 * Saat `url` berganti, `data` langsung `null` dan `loading` `true` sampai jawaban URL baru
 * datang — tidak ada jeda memperlihatkan data URL lama. Untuk URL yang sudah di-cache jawabannya
 * datang di microtask berikutnya, jadi jedanya satu frame.
 */

import { useEffect, useState } from "react";
import { fetchJsonCached } from "@/helper/fetch-json-cached";

type Envelope<T> = { data: T } | { error: string };

interface Settled<T> {
  url: string;
  data: T | null;
  error: string | null;
}

export interface UseApiJsonResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApiJson<T>(url: string | null, fallbackError: string): UseApiJsonResult<T> {
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    fetchJsonCached<Envelope<T>>(url)
      .then(({ ok, json }) => {
        if (cancelled) return;
        if (!ok || "error" in json) {
          setSettled({ url, data: null, error: ("error" in json && json.error) || fallbackError });
          return;
        }
        setSettled({ url, data: json.data, error: null });
      })
      .catch(() => {
        if (!cancelled) setSettled({ url, data: null, error: fallbackError });
      });

    return () => {
      cancelled = true;
    };
  }, [url, fallbackError]);

  if (!url) return { data: null, loading: false, error: null };

  const current = settled !== null && settled.url === url ? settled : null;
  return {
    data: current?.data ?? null,
    loading: current === null,
    error: current?.error ?? null,
  };
}
