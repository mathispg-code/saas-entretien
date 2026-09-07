"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { SpinnerIcon } from "../../components/icons";
import { GENERIC_ERROR_MESSAGE } from "../types";

const UNLOCK_LABEL = "Débloquer l'accès complet pour cet entretien";

async function startCheckout(generationId: string): Promise<string> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ generationId }),
  });

  const data: { url?: string; error?: string } = await res.json().catch(() => ({}));

  if (!res.ok || !data.url) {
    throw new Error(data.error ?? GENERIC_ERROR_MESSAGE);
  }

  return data.url;
}

/**
 * Bandeau de deverrouillage affiche a la place des fonctionnalites payantes
 * (feedback, analyse CV, export PDF) tant que la generation n'est pas payee.
 * Meme action partout : lance Stripe Checkout pour ce generationId precis.
 */
export function UnlockBanner({
  generationId,
  description,
  compact = false,
}: {
  generationId: string | null;
  description?: string;
  compact?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUnlock() {
    if (!generationId || loading) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = await startCheckout(generationId);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : GENERIC_ERROR_MESSAGE);
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={handleUnlock}
          disabled={!generationId || loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <SpinnerIcon className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          {UNLOCK_LABEL}
        </button>
        {error && <p className="text-xs text-rose-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/60 p-6 text-center">
      <Lock className="mx-auto h-6 w-6 text-emerald-600" />
      {description && <p className="mt-2 text-sm text-slate-700">{description}</p>}
      <button
        type="button"
        onClick={handleUnlock}
        disabled={!generationId || loading}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-navy-950 shadow-[0_0_25px_-8px_rgba(16,185,129,0.7)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <SpinnerIcon className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        {loading ? "Redirection…" : `${UNLOCK_LABEL} — 3,99 €`}
      </button>
      {error && <p className="mt-3 text-sm text-rose-500">{error}</p>}
    </div>
  );
}
