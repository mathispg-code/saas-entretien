"use client";

import { useState } from "react";
import { CheckIcon, SpinnerIcon } from "../../components/icons";
import {
  formatAccessSummary,
  openBillingPortal,
  type ActiveAccessStatus,
} from "../../lib/access-client";
import { GENERIC_ERROR_MESSAGE } from "../types";

/**
 * Etat de l'acces illimite sur l'appareil (Pass hebdo / Illimite), avec le
 * lien "Gerer mon abonnement" (Customer Portal Stripe : resiliation en un
 * clic, carte bancaire, factures). Affiche a la place du paiement par fiche.
 */
export function AccessStatusBar({
  status,
  justActivated,
}: {
  status: ActiveAccessStatus;
  justActivated: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleManage() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      window.location.href = await openBillingPortal();
    } catch (err) {
      setError(err instanceof Error ? err.message : GENERIC_ERROR_MESSAGE);
      setLoading(false);
    }
  }

  return (
    <div
      className={`mb-4 rounded-2xl border p-4 text-left text-sm ${
        status.pastDue
          ? "border-amber-400/40 bg-amber-500/10 text-amber-100"
          : "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-start gap-2">
          <CheckIcon className="mt-0.5 h-4 w-4 flex-none" />
          <span>
            {justActivated && "Paiement confirmé. "}
            {formatAccessSummary(status)}.
          </span>
        </p>
        {status.canManage && (
          <button
            type="button"
            onClick={handleManage}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
          >
            {loading && <SpinnerIcon className="h-3.5 w-3.5" />}
            Gérer mon abonnement
          </button>
        )}
      </div>
      {status.pastDue && (
        <p className="mt-2">
          Ton dernier paiement a échoué : mets à jour ta carte via «&nbsp;Gérer mon
          abonnement&nbsp;». Ton accès est conservé pendant que Stripe retente le paiement.
        </p>
      )}
      {error && <p className="mt-2 text-rose-300">{error}</p>}
    </div>
  );
}
