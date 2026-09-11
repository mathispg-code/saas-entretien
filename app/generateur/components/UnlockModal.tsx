"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Download, FileText, Lock, Sparkles, Unlock, X } from "lucide-react";
import { SpinnerIcon } from "../../components/icons";
import { startCheckout } from "../lib/checkout";
import { GENERIC_ERROR_MESSAGE } from "../types";

const BENEFITS = [
  {
    icon: Unlock,
    text: "Génération étendue jusqu'à 12 questions (au lieu de 5)",
  },
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
 * Modale de conversion : benefices communs (partages par les 3 offres) en
 * haut, puis les 3 offres sous forme compacte nom/prix/bouton (voir /tarifs
 * pour le detail complet de chacune). Reutilisee pour les deux points
 * d'entree : clic sur un element verrouille (feedback / CV / export PDF /
 * 8-12 questions) et popup automatique apres une generation gratuite — seul
 * le libelle du bouton secondaire differe entre les deux.
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
  // Pass hebdo et Illimite pas encore branches a Stripe (voir TODO.md) :
  // simulation visuelle uniquement, jamais de fausse redirection de paiement.
  // Nature differente a garder en tete pour le futur branchement :
  // - Pass hebdo (6,99€) : paiement UNIQUE comme "Fiche unique", donne un
  //   acces illimite 7 jours puis s'arrete seul, sans reconduction — donc
  //   un Stripe Checkout en mode "payment", pas "subscription".
  // - Illimite (9,99€/mois) : vrai ABONNEMENT recurrent, redebite chaque
  //   mois jusqu'a resiliation — Stripe Checkout en mode "subscription".
  const [subscribing, setSubscribing] = useState(false);
  const [selectingWeekly, setSelectingWeekly] = useState(false);
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

  function handleSubscribeClick() {
    console.log("Offre sélectionnée : illimite (depuis la modale de paiement)");
    setSubscribing(true);
    setTimeout(() => setSubscribing(false), 1800);
  }

  function handleWeeklyClick() {
    console.log("Offre sélectionnée : pass-hebdo (depuis la modale de paiement)");
    setSelectingWeekly(true);
    setTimeout(() => setSelectingWeekly(false), 1800);
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
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0F2E4C] to-[#050B14] p-5 shadow-2xl shadow-black/40 outline-none sm:p-8"
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
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10">
            <Lock className="h-4 w-4 text-emerald-400" />
          </div>

          <h2
            id="unlock-modal-title"
            className="mt-3 text-center text-xl font-bold text-white sm:text-2xl"
          >
            Va plus loin dans ta préparation
          </h2>

          <p className="mt-2 text-center text-sm text-slate-300">
            Un entretien, ça ne se rejoue pas deux fois. Voici ce que tu débloques :
          </p>

          <div className="mt-5 space-y-2.5">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-500/15">
                  <Icon className="h-3.5 w-3.5 text-emerald-400" />
                </span>
                <p className="text-sm text-slate-300">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">Fiche unique</p>
                  <p className="text-xs text-slate-400">3,99 € · paiement unique</p>
                </div>
                <button
                  type="button"
                  onClick={handleUnlock}
                  disabled={!generationId || loading}
                  className="flex flex-none items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-transparent px-3.5 py-2 text-xs font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? <SpinnerIcon className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  {loading ? "Redirection…" : "Choisir"}
                </button>
              </div>
              {error && <p className="mt-2 text-center text-xs text-rose-300">{error}</p>}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">Pass hebdomadaire</p>
                  <p className="text-xs text-slate-400">6,99 € · paiement unique</p>
                </div>
                <button
                  type="button"
                  onClick={handleWeeklyClick}
                  disabled={selectingWeekly}
                  className="flex flex-none items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-transparent px-3.5 py-2 text-xs font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/10 disabled:cursor-default"
                >
                  {selectingWeekly ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Choisi
                    </>
                  ) : (
                    "Choisir"
                  )}
                </button>
              </div>
            </div>

            <div className="relative rounded-2xl border-2 border-emerald-400 bg-emerald-500/10 p-3">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy-950">
                Populaire
              </span>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">Illimité</p>
                  <p className="text-xs text-slate-300">9,99 € · / mois</p>
                </div>
                <button
                  type="button"
                  onClick={handleSubscribeClick}
                  disabled={subscribing}
                  className="flex flex-none items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-navy-950 shadow-[0_0_20px_-8px_rgba(16,185,129,0.7)] transition hover:bg-emerald-400 disabled:cursor-default"
                >
                  {subscribing ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Choisi
                    </>
                  ) : (
                    "S'abonner"
                  )}
                </button>
              </div>
            </div>
          </div>

          <Link
            href="/tarifs"
            className="mt-3 block text-center text-xs font-medium text-emerald-300 transition hover:text-emerald-200 hover:underline"
          >
            Voir tous les tarifs →
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="mt-2 w-full text-center text-sm text-slate-400 transition hover:text-slate-200 hover:underline"
          >
            {secondaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
