import { z } from 'zod'
import type { ScoredArea, ScoringResult } from '@/lib/scoring'

export function buildScoreRequestSchema(tipe3Values: string[]) {
  return z.object({
    tipe_3: z.enum([...tipe3Values, 'SEMUA'] as unknown as [string, ...string[]]),
    harga_target: z.number().int().min(1000).max(1_000_000),
    harga_sumber: z.enum(['pengguna', 'perkiraan']).optional(),
  })
}

export type ScoreRequest = {
  tipe_3: string
  harga_target: number
  harga_sumber?: 'pengguna' | 'perkiraan'
}

export type RankedArea = Omit<ScoredArea, 'skor' | 'komponen'> & {
  skor: number
  komponen: { demand: number; competitive_headroom: number; segment_match: number }
}

export function isRankedArea(area: ScoredArea): area is RankedArea {
  return (
    area.is_rankable &&
    area.skor !== null &&
    area.komponen.demand !== null &&
    area.komponen.segment_match !== null
  )
}

export type ScoreResponse = {
  areas: RankedArea[]
  catatan: ScoringResult['catatan'] & { harga_sumber: 'pengguna' | 'perkiraan' }
}
