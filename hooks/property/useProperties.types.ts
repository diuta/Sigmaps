import type { PropertyUnit } from "@/types/property";

export interface UsePropertiesResult {
  properties: PropertyUnit[];
  loading: boolean;
  error: string | null;
}
