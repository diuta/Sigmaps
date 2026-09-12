import type { IntentOutput } from "@/types/prompt-request";
import type { ScoreResponse } from "@/types/scoring";

export interface BriefResultContextValue {
  /** Hasil /api/prompt-request. Null sebelum brief pernah disubmit. */
  intent: IntentOutput | null;
  /** Hasil /api/score. Null sebelum brief pernah disubmit. */
  scoreResult: ScoreResponse | null;
  loading: boolean;
  /** Pesan error siap-tampil (bukan raw error), null kalau tidak ada galat. */
  error: string | null;
  /** Jalankan alur lengkap: prompt -> intent -> score. */
  submitBrief: (prompt: string) => Promise<void>;
}
