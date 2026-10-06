"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckIcon, SpinnerIcon } from "../../components/icons";
import {
  confirmAccessRecovery,
  formatAccessSummary,
  type ActiveAccessStatus,
} from "../../lib/access-client";
import { GENERIC_ERROR_MESSAGE } from "../../generateur/types";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

type Phase = "reading" | "ready" | "missing" | "working" | "done" | "error";

/**
 * Etape 2 du lien magique. Le jeton est dans le fragment de l'URL (#t=...),
 * que le navigateur n'envoie jamais au serveur : on le lit ici, on l'efface de
 * la barre d'adresse, puis il n'est consomme qu'au clic sur le bouton (POST).
 * Un scanner de liens ou un prechargement qui ouvre cette page ne peut donc pas
 * le "brûler".
 */
export function VerifierClient() {
  const [phase, setPhase] = useState<Phase>("reading");
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<ActiveAccessStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const match = window.location.hash.match(/^#t=([^&]+)$/);
    const candidate = match?.[1] ?? null;
    if (candidate && TOKEN_PATTERN.test(candidate)) {
      setToken(candidate);
      setPhase("ready");
    } else {
      setPhase("missing");
    }
    // Retire le jeton de la barre d'adresse et de l'historique.
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  async function handleConfirm() {
    if (!token || phase === "working") return;
    setPhase("working");
    setError(null);
    try {
      setStatus(await confirmAccessRecovery(token));
      setToken(null);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : GENERIC_ERROR_MESSAGE);
      setToken(null);
      setPhase("error");
    }
  }

  if (phase === "reading") {
    return <p className="text-sm text-slate-500">Chargement…</p>;
  }

  if (phase === "done" && status) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
        <p className="flex items-center gap-2 text-base font-semibold text-navy-900">
          <CheckIcon className="h-5 w-5 text-emerald-600" />
          Accès retrouvé sur ce navigateur
        </p>
        <p className="mt-2 text-sm text-slate-700">{formatAccessSummary(status)}.</p>
        <p className="mt-2 text-xs text-slate-500">
          L&apos;accès est maintenant actif ici et a été désactivé sur ton ancien appareil.
          Continue d&apos;utiliser CandiView dans ce même navigateur.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/generateur"
            className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-navy-950 transition hover:bg-emerald-400"
          >
            Aller au générateur
          </Link>
          <Link
            href="/mon-acces"
            className="rounded-xl border border-navy-300 px-5 py-3 text-sm font-semibold text-navy-800 transition hover:border-emerald-400 hover:text-emerald-600"
          >
            Voir mon accès
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "missing" || phase === "error") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-bold text-navy-900">Lien impossible à utiliser</h1>
        <p className="mt-2 text-sm text-slate-600">
          {phase === "error"
            ? error
            : "Ce lien est incomplet. Copie-le en entier depuis ton email, ou demande-en un nouveau."}
        </p>
        <Link
          href="/mon-acces"
          className="mt-4 inline-block rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-navy-950 transition hover:bg-emerald-400"
        >
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-lg font-bold text-navy-900">Retrouver mon accès</h1>
      <p className="mt-2 text-sm text-slate-600">
        Active ton accès CandiView sur ce navigateur. Il sera désactivé sur l&apos;appareil où il
        était actif jusqu&apos;ici.
      </p>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={phase === "working"}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-navy-950 shadow-[0_0_25px_-8px_rgba(16,185,129,0.7)] transition hover:bg-emerald-400 disabled:opacity-60"
      >
        {phase === "working" && <SpinnerIcon className="h-4 w-4" />}
        Retrouver mon accès sur ce navigateur
      </button>
      <p className="mt-4 text-xs text-slate-500">
        Astuce : ouvre ce lien dans le navigateur où tu utilises CandiView. Depuis l&apos;appli
        Gmail, il s&apos;ouvre parfois dans un navigateur intégré : l&apos;accès sera alors activé
        dans celui-ci et pas dans ton navigateur habituel.
      </p>
    </div>
  );
}
