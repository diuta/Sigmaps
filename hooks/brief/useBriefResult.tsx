"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { BriefResultContextValue } from "./useBriefResult.types";

const BriefResultContext = createContext<BriefResultContextValue | undefined>(undefined);

export function BriefResultProvider({ children }: { children: ReactNode }) {
  const [intent, setIntent] = useState<BriefResultContextValue["intent"]>(null);
  const [scoreResult, setScoreResult] = useState<BriefResultContextValue["scoreResult"]>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitBrief(prompt: string) {
    setLoading(true);
    setError(null);

    try {
      const intentRes = await fetch("/api/prompt-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teks: prompt }),
      });
      const intentJson = await intentRes.json();

      if (!intentRes.ok || "error" in intentJson) {
        setError(intentJson.error ?? "Gagal memahami rencana usaha");
        setIntent(null);
        setScoreResult(null);
        return;
      }

      setIntent(intentJson.data);

      const scoreRes = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipe_3: intentJson.data.tipe_3,
          harga_target: intentJson.data.harga_target,
          harga_sumber: intentJson.data.harga_sumber,
        }),
      });
      const scoreJson = await scoreRes.json();

      if (!scoreRes.ok || "error" in scoreJson) {
        setError(scoreJson.error ?? "Gagal menilai kawasan");
        setScoreResult(null);
        return;
      }

      setScoreResult(scoreJson.data);
    } catch {
      setError("Gagal memproses rencana usaha");
      setIntent(null);
      setScoreResult(null);
    } finally {
      setLoading(false);
    }
  }

  function resetBrief() {
    setIntent(null);
    setScoreResult(null);
    setError(null);
  }

  return (
    <BriefResultContext.Provider value={{ intent, scoreResult, loading, error, submitBrief, resetBrief }}>
      {children}
    </BriefResultContext.Provider>
  );
}

export function useBriefResult(): BriefResultContextValue {
  const context = useContext(BriefResultContext);
  if (!context) {
    throw new Error("useBriefResult must be used within a BriefResultProvider");
  }
  return context;
}
