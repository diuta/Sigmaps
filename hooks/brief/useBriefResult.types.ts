import type { IntentOutput } from "@/types/prompt-request";
import type { ScoreResponse } from "@/types/scoring";

export interface BriefResultContextValue {
  intent: IntentOutput | null;
  scoreResult: ScoreResponse | null;
  loading: boolean;
  error: string | null;
  submitBrief: (prompt: string) => Promise<void>;
}
