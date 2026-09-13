"use client";

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
