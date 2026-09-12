"use client";

/**
 * hooks/sentiment/useCommunitySentiment.tsx
 * Ambil ringkasan Community Activity satu stasiun dari /api/community-sentiment.
 * Endpoint ini memanggil Gemini tiap request (belum ada cache — lihat
 * docs/api-community-sentiment.md), jadi jangan panggil hook ini kalau
 * station_id belum ada / belum jelas dibutuhkan.
 */

import { useEffect, useState } from "react";
import type { UseCommunitySentimentResult } from "./useCommunitySentiment.types";

export function useCommunitySentiment(stationId: string | null): UseCommunitySentimentResult {
  const [sentiment, setSentiment] = useState<UseCommunitySentimentResult["sentiment"]>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!stationId) {
        setSentiment(null);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/community-sentiment?station_id=${encodeURIComponent(stationId)}`);
        const json = await res.json();

        if (cancelled) return;

        if (!res.ok || "error" in json) {
          setError(json.error ?? "Gagal mengambil ringkasan komunitas");
          setSentiment(null);
          return;
        }

        setSentiment(json.data);
      } catch {
        if (!cancelled) {
          setError("Gagal mengambil ringkasan komunitas");
          setSentiment(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [stationId]);

  return { sentiment, loading, error };
}
