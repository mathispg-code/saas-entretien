"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, MessageSquare } from "lucide-react";
import { LightbulbIcon, SpinnerIcon } from "../../components/icons";
import { ConseilRow } from "./shared";
import { UnlockBanner } from "./UnlockBanner";
import { GENERIC_ERROR_MESSAGE } from "../types";
import type { CvVigilancePoint } from "../types";

/**
 * Contenu payant : jamais recu via le flux de generation ni via
 * generation-status (voir app/api/cv-vigilance). Ce composant va chercher
 * lui-meme les points une fois la generation payee, plutot que de les
 * recevoir en prop — tant que paid est faux, aucun appel n'est fait.
 */
export function CvVigilanceTab({
  generationId,
  paid,
  onUnlockClick,
}: {
  generationId: string | null;
  paid: boolean;
  onUnlockClick: () => void;
}) {
  const [points, setPoints] = useState<CvVigilancePoint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paid || !generationId) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/cv-vigilance?id=${generationId}`)
      .then(async (res) => {
        const data: { cvVigilance?: CvVigilancePoint[]; error?: string } = await res
          .json()
          .catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? GENERIC_ERROR_MESSAGE);
          return;
        }
        setPoints(data.cvVigilance ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(GENERIC_ERROR_MESSAGE);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [paid, generationId]);

  if (!paid) {
    return (
      <section>
        <div className="mb-4 inline-flex animate-fade-in items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
          <AlertTriangle className="h-4 w-4" />
          Points de vigilance sur ton CV
        </div>
        <UnlockBanner
          generationId={generationId}
          description="Découvre les points que le recruteur va probablement creuser à propos de ton CV, et comment y répondre sereinement."
          onUnlockClick={onUnlockClick}
        />
      </section>
    );
  }

  if (loading) {
    return (
      <section className="flex items-center justify-center gap-2 py-12 text-slate-500">
        <SpinnerIcon className="h-5 w-5" />
        Chargement de l&apos;analyse CV…
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
          {error}
        </p>
      </section>
    );
  }

  if (!points) {
    return null;
  }

  return (
    <section>
      <div className="mb-4 inline-flex animate-fade-in items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
        <AlertTriangle className="h-4 w-4" />
        {points.length} point{points.length > 1 ? "s" : ""} de vigilance identifié
        {points.length > 1 ? "s" : ""} sur ton CV
      </div>
      <div className="space-y-4">
        {points.map((item, i) => (
          <div
            key={i}
            style={{ animationDelay: `${i * 60}ms` }}
            className="animate-fade-in-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm [animation-fill-mode:backwards] sm:p-6"
          >
            <p className="font-semibold text-slate-900 sm:text-lg">{item.point}</p>
            <div className="mt-3 space-y-2 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-3 sm:p-4">
              <ConseilRow
                icon={MessageSquare}
                label="Question probable"
                text={item.questionProbable}
                accentClassName="text-amber-600"
                labelClassName="text-amber-700"
              />
              <ConseilRow
                icon={LightbulbIcon}
                label="Comment y répondre"
                text={item.conseil}
                accentClassName="text-amber-600"
                labelClassName="text-amber-700"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
