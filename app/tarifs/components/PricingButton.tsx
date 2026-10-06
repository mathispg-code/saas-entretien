"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SpinnerIcon } from "../../components/icons";
import { startCheckout } from "../../generateur/lib/checkout";
import { GENERIC_ERROR_MESSAGE } from "../../generateur/types";
import {
  fetchAccessStatus,
  formatAccessSummary,
  startPlanCheckout,
  type AccessStatus,
} from "../../lib/access-client";
import { getStoredGenerationId, storeGenerationId } from "../../lib/generation-id";

const UNUSED_PACK_MESSAGE =
  "Tu as déjà un pack Fiche unique payé et pas encore utilisé : il sera appliqué à ta prochaine génération.";

/**
 * Pack "Fiche unique" depuis /tarifs : il n'y a pas encore de generation a
 * debloquer, on en reserve donc une vide (via /api/generation-placeholder)
 * qui sera consommee par la PROCHAINE generation de l'utilisateur. On
 * reutilise celle deja reservee et jamais payee plutot que d'en creer une
 * nouvelle a chaque clic. Le flux reel de Stripe est le meme que dans la
 * modale du generateur (startCheckout) — inchange.
 */
async function reserveGenerationForUniquePack(): Promise<string> {
  const storedId = getStoredGenerationId();
  if (storedId) {
    try {
      const res = await fetch(`/api/generation-status?id=${storedId}`);
      if (res.ok) {
        const data: { paid: boolean; result: unknown | null } = await res.json();
        if (data.paid && !data.result) {
          throw new Error(UNUSED_PACK_MESSAGE);
        }
        if (!data.paid && !data.result) {
          return storedId;
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message === UNUSED_PACK_MESSAGE) throw error;
      // Statut illisible : on reserve simplement une nouvelle generation.
    }
  }

  const res = await fetch("/api/generation-placeholder", { method: "POST" });
  const data: { id?: string; error?: string } = await res.json().catch(() => ({}));
  if (!res.ok || !data.id) {
    throw new Error(data.error ?? GENERIC_ERROR_MESSAGE);
  }
  storeGenerationId(data.id);
  return data.id;
}

export function PricingButton({
  plan,
  label,
  variant,
}: {
  plan: "fiche-unique" | "pass-hebdo" | "illimite";
  label: string;
  variant: "primary" | "secondary";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [access, setAccess] = useState<AccessStatus | null>(null);

  useEffect(() => {
    fetchAccessStatus().then(setAccess);
  }, []);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      let url: string;
      if (plan === "fiche-unique") {
        url = await startCheckout(await reserveGenerationForUniquePack());
      } else {
        url = await startPlanCheckout(plan === "pass-hebdo" ? "hebdo" : "mensuel");
      }
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : GENERIC_ERROR_MESSAGE);
      setLoading(false);
    }
  }

  // Acces illimite deja actif sur cet appareil : plus rien a acheter.
  if (access?.active) {
    return (
      <div className="space-y-3 text-center">
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {formatAccessSummary(access)}
        </p>
        <Link
          href="/generateur"
          className="inline-block text-sm font-medium text-emerald-600 underline hover:text-emerald-700"
        >
          Aller au générateur
        </Link>
      </div>
    );
  }

  const baseClasses =
    "flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-default";
  const variantClasses =
    variant === "primary"
      ? "bg-emerald-500 text-navy-950 shadow-[0_0_25px_-8px_rgba(16,185,129,0.7)] enabled:hover:bg-emerald-400 enabled:hover:scale-[1.02] enabled:active:scale-[0.98]"
      : "border border-navy-300 text-navy-800 enabled:hover:border-emerald-400 enabled:hover:text-emerald-600";

  return (
    <div className="space-y-3">
      {plan === "fiche-unique" && (
        <p className="text-xs text-slate-500">
          Ce pack est utilisé pour ta <strong>prochaine génération</strong> : après le paiement, tu
          colles ta fiche de poste et tu génères jusqu&apos;à 12 questions avec feedback, analyse de
          CV et export PDF.
        </p>
      )}
      {/* La case obligatoire (CGV, accès immédiat, droit de rétractation) est
          affichée par Stripe sur la page de paiement : ici, simple information. */}
      <p className="text-xs text-slate-500">
        Tu confirmeras l&apos;acceptation des{" "}
        <Link
          href="/cgv"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline hover:text-slate-700"
        >
          CGV
        </Link>{" "}
        sur la page de paiement sécurisée.
      </p>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`${baseClasses} ${variantClasses}`}
      >
        {loading ? (
          <>
            <SpinnerIcon className="h-4 w-4" />
            Redirection…
          </>
        ) : (
          label
        )}
      </button>
      {error && (
        <p className="text-center text-xs text-rose-500">
          {error}{" "}
          {error === UNUSED_PACK_MESSAGE && (
            <Link href="/generateur" className="font-medium underline">
              Aller au générateur
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
