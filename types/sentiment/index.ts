/**
 * types/sentiment/index.ts
 * Kontrak request/response /api/community-sentiment.
 * Sumber: context/context-mvp.md §6.8b
 */

export interface CommunitySentimentResponse {
  /**
   * Ringkasan Gemini dari Community Activity kawasan ini.
   * ⚠️ Personal info sudah dibuang sebelum dikirim ke AI:
   *    user_name, user_full_name, user_profile_picture, community_picture.
   */
  ringkasan: string;
  /** Jumlah laporan Activity yang jadi input ringkasan */
  jumlah_laporan: number;
}
