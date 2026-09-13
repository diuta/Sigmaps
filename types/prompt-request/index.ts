import type { Tipe3 } from "@/types/tipe3";

export interface IntentOutput {
  tipe_3: Tipe3;
  harga_target: number;
  harga_sumber: "pengguna" | "perkiraan";
  confidence: number;
}
