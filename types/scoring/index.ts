import type {
  RankedArea,
  ScoreRequest as ScoreRequestContract,
  ScoreResponse as ScoreResponseContract,
} from "@/lib/schemas/score";

export type ScoreRequest = ScoreRequestContract;

export type AreaScore = RankedArea;

export type ScoreComponentKey = keyof AreaScore["komponen"];

export type ScoreResponse = ScoreResponseContract;
