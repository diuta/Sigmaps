"use client";

/**
 * hooks/sentiment/useCommunitySentiment.tsx
 * Ambil ringkasan Community Activity satu stasiun dari /api/community-sentiment.
 * Server meng-cache hasilnya per station_id (lib/sentiment), dan klien meng-cache per URL
 * (hooks/api/useApiJson), jadi memanggil ulang untuk stasiun yang sama itu murah; panggilan
 * pertama tiap stasiun tetap 1–3 detik Gemini. Tetap jangan panggil hook ini kalau
 * station_id belum ada / belum jelas dibutuhkan.
 */

import { useApiJson } from "@/hooks/api/useApiJson";
import type { CommunitySentimentResponse } from "@/types/sentiment";
import type { UseCommunitySentimentResult } from "./useCommunitySentiment.types";

export function useCommunitySentiment(stationId: string | null): UseCommunitySentimentResult {
  const { data, loading, error } = useApiJson<CommunitySentimentResponse>(
    stationId ? `/api/community-sentiment?station_id=${encodeURIComponent(stationId)}` : null,
    "Gagal mengambil ringkasan komunitas",
  );
  return { sentiment: data, loading, error };
}
