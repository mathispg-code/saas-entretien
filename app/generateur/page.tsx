"use client";

import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { SideDecoration } from "../components/SideDecoration";
import { ClockIcon, DocumentIcon, SpinnerIcon, UserIcon, ZapIcon } from "../components/icons";
import {
  FREE_TRIAL_LOCKED_MESSAGE,
  FREE_TRIAL_QUESTION_COUNT,
  hasUsedFreeTrial,
  markFreeTrialUsed,
} from "../lib/free-trial";
import { AnalyseCard } from "./components/AnalyseCard";
import { ResultsActionBar } from "./components/ResultsActionBar";
import { ResultsTabs } from "./components/ResultsTabs";
import { GENERIC_ERROR_MESSAGE } from "./types";
import type { Analyse, CvVigilancePoint, Question, QuestionAPoser } from "./types";

type Mode = "text" | "pdf";

const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20] as const;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
// La generation combine desormais analyse + questions + astuces + points CV +
// questions a poser en un seul appel : un delai plus genereux que le feedback
// (sortie plus courte) est necessaire, notamment avec CV + 20 questions.
// Mesure empirique : ~82s pour 5 questions + CV, prevoir plus large pour 20.
const GENERATION_TIMEOUT_MS = 150_000;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // result is "data:application/pdf;base64,XXXX" — keep only the base64 part
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function GenerateurPage() {
  const [mode, setMode] = useState<Mode>("text");
  const [jobText, setJobText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState(FREE_TRIAL_QUESTION_COUNT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [analyse, setAnalyse] = useState<Analyse | null>(null);
  const [cvVigilance, setCvVigilance] = useState<CvVigilancePoint[] | null>(null);
  const [questionsAPoser, setQuestionsAPoser] = useState<QuestionAPoser[] | null>(null);
  // Incremente a chaque generation reussie : utilise comme key sur ResultsTabs
  // pour forcer un remontage propre (onglet actif, cartes maitrisees, reponses
  // en cours redemarrent a zero sur un nouveau resultat).
  const [resultId, setResultId] = useState(0);
  // Limitation temporaire "un essai gratuit par appareil" — voir app/lib/free-trial.ts
  const [trialUsed, setTrialUsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  useEffect(() => {
    setTrialUsed(hasUsedFreeTrial());
  }, []);

  useEffect(() => {
    if (questions !== null && !hasScrolledRef.current) {
      hasScrolledRef.current = true;
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (questions === null) {
      hasScrolledRef.current = false;
    }
  }, [questions]);

  const canSubmit =
    (mode === "text" && jobText.trim().length > 0) ||
    (mode === "pdf" && pdfFile !== null);

  async function handleGenerate() {
    setError(null);
    setQuestions(null);
    setAnalyse(null);
    setCvVigilance(null);
    setQuestionsAPoser(null);

    // Garde-fou : le bouton est désactivé dans ce cas, mais on protège aussi
    // l'appel API directement. Voir app/lib/free-trial.ts.
    if (trialUsed) {
      return;
    }

    if (!canSubmit) {
      setError("Merci de coller le texte de la fiche de poste ou d'importer un PDF.");
      return;
    }

    // Nouvelle generation : on force un remontage propre de ResultsTabs des
    // maintenant (mastered/reponses locales repartent a zero), meme si les
    // donnees vont ensuite arriver progressivement pendant le meme flux.
    setResultId((id) => id + 1);
    setLoading(true);

    let receivedDone = false;
    let receivedError: string | null = null;

    try {
      const payload: {
        text?: string;
        pdfBase64?: string;
        pdfFilename?: string;
        cvBase64?: string;
        cvFilename?: string;
        questionCount?: number;
      } = { questionCount };

      if (mode === "text") {
        payload.text = jobText;
      } else if (pdfFile) {
        payload.pdfBase64 = await fileToBase64(pdfFile);
        payload.pdfFilename = pdfFile.name;
      }

      if (cvFile) {
        payload.cvBase64 = await fileToBase64(cvFile);
        payload.cvFilename = cvFile.name;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

      let res: Response;
      try {
        res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!res.body) {
        setError(GENERIC_ERROR_MESSAGE);
        return;
      }

      // Des la connexion etablie, on affiche la section resultats (vide pour
      // l'instant) pour que les questions apparaissent au fur et a mesure
      // plutot qu'un unique etat de chargement suivi d'un affichage global.
      setQuestions([]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex = buffer.indexOf("\n");
        while (newlineIndex !== -1) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          newlineIndex = buffer.indexOf("\n");

          if (!line) {
            continue;
          }

          let event: { type: string; data?: unknown; message?: string };
          try {
            event = JSON.parse(line);
          } catch {
            // Ligne corrompue (coupure au milieu d'un chunk réseau, improbable
            // mais pas impossible) : on l'ignore plutôt que de tout casser.
            continue;
          }

          switch (event.type) {
            case "analyse":
              setAnalyse(event.data as Analyse);
              break;
            case "question":
              setQuestions((prev) => [...(prev ?? []), event.data as Question]);
              break;
            case "vigilance":
              setCvVigilance((prev) => [...(prev ?? []), event.data as CvVigilancePoint]);
              break;
            case "aPoser":
              setQuestionsAPoser((prev) => [...(prev ?? []), event.data as QuestionAPoser]);
              break;
            case "done":
              receivedDone = true;
              break;
            case "error":
              receivedError = event.message ?? GENERIC_ERROR_MESSAGE;
              setError(receivedError);
              break;
          }
        }
      }

      if (receivedDone && !receivedError) {
        markFreeTrialUsed();
        setTrialUsed(true);
      } else if (!receivedDone && !receivedError) {
        // La connexion s'est terminée sans message d'erreur explicite ni
        // événement "done" (coupure réseau, fonction serverless arrêtée en
        // cours de route...) : on garde les résultats déjà reçus plutôt que
        // de tout jeter, et on prévient que ce n'est pas complet.
        setError(
          "La génération a été interrompue avant la fin. Voici les questions déjà reçues — tu peux réessayer.",
        );
      }
    } catch {
      setError(GENERIC_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.type !== "application/pdf") {
      setError("Merci d'importer un fichier PDF.");
      setPdfFile(null);
      return;
    }
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      setError("Le fichier est trop volumineux, 5 Mo maximum.");
      setPdfFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
    setError(null);
    setPdfFile(file);
  }

  function handleCvFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.type !== "application/pdf") {
      setError("Merci d'importer un CV au format PDF.");
      setCvFile(null);
      return;
    }
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      setError("Le fichier est trop volumineux, 5 Mo maximum.");
      setCvFile(null);
      if (cvInputRef.current) {
        cvInputRef.current.value = "";
      }
      return;
    }
    setError(null);
    setCvFile(file);
  }

  function handleRemovePdf() {
    setPdfFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleRemoveCv() {
    setCvFile(null);
    if (cvInputRef.current) {
      cvInputRef.current.value = "";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      <section className="relative overflow-hidden bg-gradient-to-b from-[#0F2E4C] to-[#050B14] px-4 pb-16 pt-14 sm:pb-20 sm:pt-20">
        <div
          aria-hidden
          className="motion-safe:animate-float-slow-1 pointer-events-none absolute -left-32 top-0 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl sm:h-96 sm:w-96"
        />
        <div
          aria-hidden
          className="motion-safe:animate-float-slow-2 pointer-events-none absolute -right-24 bottom-0 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl sm:h-[26rem] sm:w-[26rem]"
        />
        <SideDecoration />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex animate-fade-in items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-sm sm:text-sm">
            <ZapIcon className="h-3.5 w-3.5" />
            Générateur IA
          </div>

          <h1
            className="animate-fade-in-up text-3xl font-extrabold leading-tight tracking-tight [animation-fill-mode:backwards] sm:text-5xl sm:leading-[1.15]"
            style={{ animationDelay: "80ms" }}
          >
            <span className="bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">
              Des questions d&apos;entretien{" "}
            </span>
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              sur mesure
            </span>
            <span className="bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">
              , en quelques secondes
            </span>
          </h1>

          <p
            className="mx-auto mt-5 max-w-xl animate-fade-in-up text-sm text-slate-300 [animation-fill-mode:backwards] sm:text-base"
            style={{ animationDelay: "160ms" }}
          >
            Colle une fiche de poste, reçois des questions d&apos;entretien
            ciblées et des conseils pour y répondre sereinement. Simple et
            rapide.
          </p>
        </div>

        <div
          className="relative z-10 mx-auto mt-10 max-w-4xl animate-fade-in-up [animation-fill-mode:backwards]"
          style={{ animationDelay: "240ms" }}
        >
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
            <div className="mb-3 flex items-center gap-2">
              <DocumentIcon className="h-5 w-5 text-emerald-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                Fiche de poste
              </h2>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMode("text")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  mode === "text"
                    ? "bg-emerald-500 text-navy-950"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                Coller le texte
              </button>
              <button
                type="button"
                onClick={() => setMode("pdf")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  mode === "pdf"
                    ? "bg-emerald-500 text-navy-950"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                Importer un PDF
              </button>
            </div>

            {mode === "text" ? (
              <textarea
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                placeholder="Colle ici le texte de la fiche de poste…"
                rows={10}
                className="w-full resize-y rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
              />
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-navy-950 hover:file:bg-emerald-400"
                />
                {pdfFile && (
                  <p className="mt-2 text-sm text-slate-300">
                    Fichier sélectionné : {pdfFile.name}{" "}
                    <button
                      type="button"
                      onClick={handleRemovePdf}
                      className="ml-2 font-medium text-emerald-400 underline hover:text-emerald-300"
                    >
                      Retirer
                    </button>
                  </p>
                )}
              </div>
            )}

            <div className="mt-6 rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <UserIcon className="h-5 w-5 text-slate-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                  Votre CV
                </h2>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal text-slate-300">
                  Optionnel
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-400">
                Pour des conseils personnalisés à ton profil. Sinon, les
                conseils resteront génériques.
              </p>
              <input
                ref={cvInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleCvFileChange}
                className="mt-3 block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border file:border-white/20 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-white/20"
              />
              {cvFile && (
                <p className="mt-2 text-sm text-slate-300">
                  CV sélectionné : {cvFile.name}{" "}
                  <button
                    type="button"
                    onClick={handleRemoveCv}
                    className="ml-2 font-medium text-emerald-400 underline hover:text-emerald-300"
                  >
                    Retirer
                  </button>
                </p>
              )}
            </div>

            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-slate-300">
                Nombre de questions
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {QUESTION_COUNT_OPTIONS.map((count) => {
                  // Essai gratuit limité à 5 questions — voir app/lib/free-trial.ts.
                  const optionDisabled =
                    trialUsed || count !== FREE_TRIAL_QUESTION_COUNT;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setQuestionCount(count)}
                      disabled={optionDisabled}
                      aria-pressed={questionCount === count}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        questionCount === count && !trialUsed
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-white/15 bg-transparent text-slate-300 hover:border-white/30 hover:bg-white/5"
                      } ${optionDisabled ? "cursor-not-allowed opacity-40 hover:border-white/15 hover:bg-transparent" : ""}`}
                    >
                      {count} questions
                    </button>
                  );
                })}
              </div>
              {!trialUsed && (
                <p className="mt-2 text-xs text-slate-500">
                  Essai gratuit limité à {FREE_TRIAL_QUESTION_COUNT} questions.
                  Les autres options seront débloquées avec le système de
                  comptes à venir.
                </p>
              )}
            </div>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
              <Lock className="h-3.5 w-3.5 flex-none" />
              Vos documents ne sont jamais stockés, ils sont utilisés
              uniquement le temps de la génération.
            </p>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canSubmit || loading || trialUsed}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3.5 text-sm font-semibold text-navy-950 shadow-[0_0_35px_-8px_rgba(16,185,129,0.7)] transition hover:scale-[1.015] hover:bg-emerald-400 hover:shadow-[0_0_45px_-6px_rgba(16,185,129,0.85)] active:scale-[0.99] disabled:cursor-not-allowed disabled:scale-100 disabled:bg-white/10 disabled:text-slate-500 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <SpinnerIcon className="h-4 w-4" />
                  Génération en cours…
                </>
              ) : trialUsed ? (
                <>
                  <Lock className="h-4 w-4" />
                  Génération gratuite déjà utilisée
                </>
              ) : (
                <>
                  <ZapIcon className="h-4 w-4" />
                  Générer les questions
                </>
              )}
            </button>

            {error && (
              <p className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-300">
                {error}
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-slate-400 sm:text-sm">
            <div
              className="flex animate-fade-in-up items-center gap-2 [animation-fill-mode:backwards]"
              style={{ animationDelay: "320ms" }}
            >
              <UserIcon className="h-4 w-4 text-emerald-400" />
              CV optionnel
            </div>
            <div
              className="flex animate-fade-in-up items-center gap-2 [animation-fill-mode:backwards]"
              style={{ animationDelay: "400ms" }}
            >
              <ClockIcon className="h-4 w-4 text-emerald-400" />
              Résultat en quelques secondes
            </div>
          </div>
        </div>
      </section>

      {trialUsed && questions === null && (
        <main className="mx-auto max-w-4xl px-4 pb-16 pt-10">
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <Lock className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-3 text-slate-700">{FREE_TRIAL_LOCKED_MESSAGE}</p>
          </div>
        </main>
      )}

      {questions !== null && (
        <main ref={resultsRef} className="mx-auto max-w-4xl scroll-mt-20 px-4 pb-16 pt-10">
          <ResultsActionBar
            questions={questions}
            questionsAPoser={questionsAPoser}
            analyse={analyse}
            disabled={loading}
          />

          {analyse && <AnalyseCard analyse={analyse} />}

          <ResultsTabs
            key={resultId}
            questions={questions}
            analyse={analyse}
            cvVigilance={cvVigilance}
            questionsAPoser={questionsAPoser}
            expectedQuestionCount={questionCount}
            isStreaming={loading}
          />
        </main>
      )}

      <SiteFooter />
    </div>
  );
}
