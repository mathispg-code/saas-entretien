"use client";

import { useState } from "react";
import { Download, Share2 } from "lucide-react";
import { SpinnerIcon } from "../../components/icons";
import { downloadInterviewPdf } from "../lib/generatePdf";
import type { Analyse, Niveau, Question, QuestionAPoser } from "../types";

const SHARE_TEXT =
  "J'ai préparé mon entretien avec CandiView, l'outil gratuit de génération de questions d'entretien.";
const SHARE_URL = "https://candiview.fr";

export function ResultsActionBar({
  questions,
  questionsAPoser,
  niveau,
  analyse,
}: {
  questions: Question[];
  questionsAPoser: QuestionAPoser[] | null;
  niveau: Niveau;
  analyse: Analyse | null;
}) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  async function handleExportPdf() {
    setPdfLoading(true);
    setPdfError(false);
    try {
      await downloadInterviewPdf({
        questions,
        questionsAPoser: questionsAPoser ?? [],
        niveau,
        analyse,
      });
    } catch {
      setPdfError(true);
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "CandiView", text: SHARE_TEXT, url: SHARE_URL });
      } catch {
        // L'utilisateur a annulé le partage natif, rien à faire.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(`${SHARE_TEXT} ${SHARE_URL}`);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Presse-papier indisponible, on ne bloque pas l'utilisateur pour ça.
    }
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        onClick={handleExportPdf}
        disabled={pdfLoading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-navy-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pdfLoading ? (
          <SpinnerIcon className="h-4 w-4" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {pdfLoading ? "Génération du PDF…" : "Exporter en PDF"}
      </button>
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-navy-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
      >
        <Share2 className="h-4 w-4" />
        {shareCopied ? "Lien copié !" : "Partager"}
      </button>
      {pdfError && (
        <p className="w-full text-right text-xs text-rose-500">
          L&apos;export PDF a échoué, réessaie dans quelques instants.
        </p>
      )}
    </div>
  );
}
