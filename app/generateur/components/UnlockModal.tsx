"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileText, Lock, Sparkles, X } from "lucide-react";
import { SpinnerIcon } from "../../components/icons";
import { startCheckout } from "../lib/checkout";
import { GENERIC_ERROR_MESSAGE } from "../types";

const BENEFITS = [
  {
    icon: Sparkles,
    text: "Feedback personnalisé de l'IA sur chacune de tes réponses",
  },
  {
    icon: FileText,
    text: "Analyse des points faibles de ton CV que le recruteur va probablement creuser",
  },
  {
    icon: Download,
    text: "Export PDF de toutes tes questions et conseils, à emporter en entretien",
  },
];

/**
 * Modale de conversion vers le pack payant (3,99€, paiement unique).
 * Reutilisee pour les deux points d'entree : clic sur un element verrouille
 * (feedback / CV / export PDF) et popup automatique apres une generation
 * gratuite — seul le libelle du bouton secondaire differe entre les deux.
 */
export function UnlockModal({
  open,
  onClose,
  generationId,
  secondaryLabel = "Plus tard",
}: {
  open: boolean;
  onClose: () => void;
  generationId: string | null;
  secondaryLabel?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  // Reinitialise l'etat d'erreur/chargement a chaque ouverture.
  useEffect(() => {
    if (open) {
      setLoading(false);
      setError(null);
    }
  }, [open]);

  if (!open) {
    return null;
  }

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="unlock-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0F2E4C] to-[#050B14] p-6 shadow-2xl shadow-black/40 outline-none sm:p-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl"
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 text-slate-400 transition hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10">
            <Lock className="h-5 w-5 text-emerald-400" />
          </div>

          <h2
            id="unlock-modal-title"
            className="mt-4 text-center text-xl font-bold text-white sm:text-2xl"
          >
            Débloque l&apos;accès complet pour cet entretien
          </h2>

          <div className="mt-6 space-y-4">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-500/15">
                  <Icon className="h-3.5 w-3.5 text-emerald-400" />
                </span>
                <p className="text-sm text-slate-300">{text}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            3,99 € — paiement unique, pas d&apos;abonnement.
          </p>

          <button
            type="button"
            onClick={handleUnlock}
            disabled={!generationId || loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3.5 text-sm font-semibold text-navy-950 shadow-[0_0_35px_-8px_rgba(16,185,129,0.7)] transition hover:scale-[1.015] hover:bg-emerald-400 hover:shadow-[0_0_45px_-6px_rgba(16,185,129,0.85)] active:scale-[0.99] disabled:cursor-not-allowed disabled:scale-100 disabled:bg-white/10 disabled:text-slate-500 disabled:shadow-none"
          >
            {loading ? <SpinnerIcon className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {loading ? "Redirection…" : "Débloquer l'accès complet — 3,99 €"}
          </button>

          {error && (
            <p className="mt-3 text-center text-sm text-rose-300">{error}</p>
          )}

          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full text-center text-sm text-slate-400 transition hover:text-slate-200 hover:underline"
          >
            {secondaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
