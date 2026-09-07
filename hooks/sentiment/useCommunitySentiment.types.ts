import type { CommunitySentimentResponse } from "@/types/sentiment";

export interface UseCommunitySentimentResult {
  sentiment: CommunitySentimentResponse | null;
  loading: boolean;
  error: string | null;
}
