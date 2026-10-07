"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckIcon, SpinnerIcon } from "../components/icons";
import {
  fetchAccessStatus,
  formatAccessSummary,
  logoutAccess,
  openBillingPortal,
  requestAccessRecovery,
  type AccessStatus,
} from "../lib/access-client";
import { GENERIC_ERROR_MESSAGE } from "../generateur/types";
import { OFFERS_ENABLED } from "../lib/offers";

const PLAN_LABELS = { hebdo: "Pass hebdomadaire", mensuel: "Illimité (abonnement)" } as const;

export function MonAccesClient() {
  const [status, setStatus] = useState<AccessStatus | null>(null);

  useEffect(() => {
    fetchAccessStatus().then(setStatus);
  }, []);

  if (status === null) {
    return <p className="mt-8 text-sm text-slate-500">Chargement…</p>;
  }

  if (status.active) {
    return <ActiveAccess status={status} onLoggedOut={() => setStatus({ active: false })} />;
  }

  return <RecoveryForm />;
}

function ActiveAccess({
  status,
  onLoggedOut,
}: {
  status: Extract<AccessStatus, { active: true }>;
  onLoggedOut: () => void;
}) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleManage() {
    if (portalLoading) return;
    setPortalLoading(true);
    setError(null);
    try {
      window.location.href = await openBillingPortal();
    } catch (err) {
      setError(err instanceof Error ? err.message : GENERIC_ERROR_MESSAGE);
      setPortalLoading(false);
    }
  }

  async function handleLogout() {
    const confirmed = window.confirm(
      "Désactiver l'accès sur cet appareil ? Tu pourras le retrouver ensuite avec le lien reçu par email.",
    );
    if (!confirmed) return;
    await logoutAccess();
    onLoggedOut();
  }

  return (
    <div className="mt-8 space-y-4">
      <div
        className={`rounded-2xl border p-5 shadow-sm ${
          status.pastDue ? "border-amber-300 bg-amber-50" : "border-emerald-200 bg-emerald-50"
        }`}
      >
        <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
          <CheckIcon className="h-4 w-4 text-emerald-600" />
          {PLAN_LABELS[status.plan]}
        </p>
        <p className="mt-2 text-sm text-slate-700">{formatAccessSummary(status)}.</p>
        {status.emailMasked && (
          <p className="mt-1 text-xs text-slate-500">Adresse liée à l&apos;achat : {status.emailMasked}</p>
        )}
        {status.pastDue && (
          <p className="mt-3 text-sm text-amber-900">
            Ton dernier paiement a échoué : mets à jour ta carte via «&nbsp;Gérer mon
            abonnement&nbsp;». Ton accès est conservé pendant que Stripe retente le paiement.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/generateur"
          className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-navy-950 shadow-[0_0_25px_-8px_rgba(16,185,129,0.7)] transition hover:bg-emerald-400"
        >
          Aller au générateur
        </Link>
        {status.canManage && (
          <button
            type="button"
            onClick={handleManage}
            disabled={portalLoading}
            className="flex items-center gap-2 rounded-xl border border-navy-300 px-5 py-3 text-sm font-semibold text-navy-800 transition hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-60"
          >
            {portalLoading && <SpinnerIcon className="h-4 w-4" />}
            Gérer mon abonnement
          </button>
        )}
      </div>
      {error && <p className="text-sm text-rose-500">{error}</p>}

      <p className="pt-2 text-xs text-slate-500">
        Cet accès est actif sur cet appareil.{" "}
        <button type="button" onClick={handleLogout} className="font-medium underline hover:text-slate-700">
          Désactiver cet appareil
        </button>
      </p>
    </div>
  );
}

function RecoveryForm() {
  const [email, setEmail] = useState("");
  // Champ piege : invisible pour un humain, un robot le remplit.
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await requestAccessRecovery(email, website);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : GENERIC_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-slate-700 shadow-sm">
        <p className="font-semibold text-navy-900">Demande envoyée</p>
        <p className="mt-2">
          Si cette adresse correspond à un achat en cours (
          {OFFERS_ENABLED.mensuel ? "Pass hebdomadaire valide ou abonnement actif" : "Pass hebdomadaire valide"}
          ), un email contenant un lien valable 15 minutes vient de t&apos;être envoyé. Pense à
          vérifier tes courriers indésirables.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Ouvre le lien dans le navigateur où tu utilises CandiView : dans l&apos;appli Gmail, il
          s&apos;ouvre parfois dans un navigateur intégré, et l&apos;accès sera alors activé dans
          celui-ci.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-navy-900">Retrouver mon accès</h2>
      <p className="mt-1 text-sm text-slate-600">
        Aucun accès actif sur cet appareil. Saisis l&apos;adresse email utilisée lors du paiement : tu
        recevras un lien pour réactiver ton accès ici.
      </p>

      <label htmlFor="recovery-email" className="mt-4 block text-sm font-medium text-slate-700">
        Adresse email
      </label>
      <input
        id="recovery-email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="toi@exemple.fr"
        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-navy-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
      />

      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="recovery-website">Ne pas remplir</label>
        <input
          id="recovery-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={loading || email.trim() === ""}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-navy-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading && <SpinnerIcon className="h-4 w-4" />}
        Recevoir mon lien
      </button>
      {error && <p className="mt-3 text-sm text-rose-500">{error}</p>}

      <p className="mt-4 text-xs text-slate-500">
        Pas encore d&apos;accès ?{" "}
        <Link href="/tarifs" className="font-medium underline hover:text-slate-700">
          Voir les tarifs
        </Link>
      </p>
    </form>
  );
}
