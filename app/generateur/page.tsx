"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Lock, X } from "lucide-react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { SideDecoration } from "../components/SideDecoration";
import {
  CheckIcon,
  ClockIcon,
  DocumentIcon,
  SpinnerIcon,
  UserIcon,
  ZapIcon,
} from "../components/icons";
import {
  FREE_TRIAL_QUESTION_COUNT,
  hasUsedFreeTrial,
  markFreeTrialUsed,
} from "../lib/free-trial";
import {
  clearStoredGenerationId,
  getStoredGenerationId,
  storeGenerationId,
} from "../lib/generation-id";
import { hasSeenUnlockModal, markUnlockModalSeen } from "../lib/unlock-modal-seen";
import { AnalyseCard } from "./components/AnalyseCard";
import { ResultsActionBar } from "./components/ResultsActionBar";
import { ResultsTabs } from "./components/ResultsTabs";
import { UnlockModal } from "./components/UnlockModal";
import { GENERIC_ERROR_MESSAGE } from "./types";
import type { Analyse, Question, QuestionAPoser } from "./types";

// Delai avant d'ouvrir automatiquement la popup de conversion apres une
// generation gratuite terminee, pour ne pas entrer en collision avec le
// scroll automatique vers les resultats.
const AUTO_UNLOCK_MODAL_DELAY_MS = 700;

type Mode = "text" | "pdf";

const QUESTION_COUNT_OPTIONS = [5, 8, 12] as const;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
// Filet de securite cote client : le serveur s'interrompt lui-meme a 57s
// (voir SOFT_DEADLINE_MS dans app/api/generate/route.ts) et renvoie toujours
// un evenement "error" ou "done" avant de fermer la connexion. Ce timeout ne
// sert que pour les cas ou meme cette fermeture propre n'arrive pas
// (connexion qui reste ouverte sans plus rien envoyer, etc.) : il couvre
// tout le cycle, de l'envoi de la requete a la reception de "done", pas
// seulement l'attente des en-tetes de reponse.
const GENERATION_TIMEOUT_MS = 65_000;
const GENERATION_TIMEOUT_MESSAGE = "La génération prend plus de temps que prévu, réessaie.";

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
  // Indique si un onglet CV doit exister — jamais le contenu lui-meme, qui
  // est du contenu payant recupere par CvVigilanceTab via /api/cv-vigilance
  // une fois la generation debloquee. Voir app/api/generate et
  // app/api/generation-status.
  const [hasCv, setHasCv] = useState(false);
  const [questionsAPoser, setQuestionsAPoser] = useState<QuestionAPoser[] | null>(null);
  // Id de la generation en cours/la plus recente (table Supabase
  // "generations") — voir app/lib/generation-id.ts. Servira a l'etape 3 pour
  // verifier le statut de paiement.
  const [generationId, setGenerationId] = useState<string | null>(null);
  // Statut de paiement de la generation en cours — voir app/api/checkout et
  // app/api/webhooks/stripe. Verrouille feedback/analyse CV/export PDF tant
  // que false.
  const [paid, setPaid] = useState(false);
  // Bandeau de confirmation affiche une seule fois au retour reussi de
  // Stripe Checkout (voir hydrateFromStoredGeneration) — jamais au simple
  // rechargement d'une generation deja payee.
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  // Incremente a chaque generation reussie : utilise comme key sur ResultsTabs
  // pour forcer un remontage propre (onglet actif, cartes maitrisees, reponses
  // en cours redemarrent a zero sur un nouveau resultat).
  const [resultId, setResultId] = useState(0);
  // Limitation temporaire "un essai gratuit par appareil" — voir app/lib/free-trial.ts
  const [trialUsed, setTrialUsed] = useState(false);
  // Popup de conversion vers le pack payant (voir UnlockModal). isAutoPopup
  // change uniquement le libelle du bouton secondaire ("Plus tard" au clic
  // sur un element verrouille, message plus specifique pour la popup
  // automatique apres generation).
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [isAutoPopup, setIsAutoPopup] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  useEffect(() => {
    setTrialUsed(hasUsedFreeTrial());

    const storedId = getStoredGenerationId();
    if (!storedId) {
      return;
    }
    setGenerationId(storedId);

    // Retour de Stripe Checkout : le webhook qui met a jour le statut de
    // paiement peut arriver avec un leger decalage par rapport a la
    // redirection du navigateur, on retente donc quelques fois avant
    // d'abandonner. Dans les autres cas (chargement normal de la page), un
    // seul essai suffit.
    const checkoutStatus = new URLSearchParams(window.location.search).get("checkout");
    const maxAttempts = checkoutStatus === "success" ? 5 : 1;

    async function hydrateFromStoredGeneration() {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let res: Response;
        try {
          res = await fetch(`/api/generation-status?id=${storedId}`);
        } catch {
          return;
        }

        if (res.status === 404 || res.status === 400) {
          clearStoredGenerationId();
          setGenerationId(null);
          return;
        }
        if (!res.ok) {
          return;
        }

        const data: {
          paid: boolean;
          result: {
            analyse: Analyse;
            questions: Question[];
            questionsAPoser: QuestionAPoser[];
            hasCv: boolean;
          } | null;
        } = await res.json();
        if (data.result) {
          setAnalyse(data.result.analyse);
          setQuestions(data.result.questions);
          setQuestionsAPoser(data.result.questionsAPoser);
          setHasCv(data.result.hasCv);
        }
        setPaid(data.paid);
        // Confirmation affichee une fois, seulement au retour reel de Stripe
        // (pas a chaque rechargement de page ulterieur ou data.paid est deja
        // vrai) — voir le bandeau pres des resultats.
        if (data.paid && checkoutStatus === "success") {
          setShowPaymentConfirmation(true);
        }

        if (data.paid || attempt === maxAttempts - 1) {
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    hydrateFromStoredGeneration();

    if (checkoutStatus) {
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
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
  // Essai gratuit consomme et generation courante pas (encore) payee : bloque
  // une nouvelle generation. Une seule regle partout : un paiement debloque
  // une generation precise, point (voir app/api/generate/route.ts et
  // app/api/checkout/route.ts) — jamais un flag "a vie" sur l'appareil.
  const isLocked = trialUsed && !paid;

  async function handleGenerate() {
    // Si la generation actuellement suivie est deja payee, on la reutilise :
    // meme id, donc le paiement (feedback/CV/PDF, 8/12 questions) reste
    // valable pour cette nouvelle generation — voir
    // openUnlockModalForLockedForm et app/api/generate/route.ts.
    const reusableGenerationId = paid ? generationId : null;

    setError(null);
    setQuestions(null);
    setAnalyse(null);
    setHasCv(false);
    setQuestionsAPoser(null);
    setGenerationId(reusableGenerationId);
    setPaid(Boolean(reusableGenerationId));
    setUnlockModalOpen(false);
    setShowPaymentConfirmation(false);

    // Garde-fou : le bouton est désactivé dans ce cas, mais on protège aussi
    // l'appel API directement. Voir app/lib/free-trial.ts. Une generation
    // deja payee reste generable a nouveau (reusableGenerationId non nul).
    if (trialUsed && !reusableGenerationId) {
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
    // Suivi local plutot que de relire l'etat React generationId apres coup :
    // setGenerationId ne met pas a jour la valeur capturee par cette closure
    // au sein du meme appel de fonction (meme principe que receivedDone).
    let capturedGenerationId: string | null = null;
    const controller = new AbortController();
    // Couvre tout le cycle (requete + lecture complete du flux) : voir le
    // commentaire sur GENERATION_TIMEOUT_MS plus haut.
    const timeoutId = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

    try {
      const payload: {
        text?: string;
        pdfBase64?: string;
        pdfFilename?: string;
        cvBase64?: string;
        cvFilename?: string;
        questionCount?: number;
        generationId?: string;
      } = { questionCount };

      // Reutilise et revalide cote serveur une generation deja payee (voir
      // app/api/generate/route.ts) — jamais un flag "a vie" sur l'appareil,
      // uniquement cette generation precise.
      if (reusableGenerationId) {
        payload.generationId = reusableGenerationId;
      }

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

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

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

          let event: {
            type: string;
            data?: unknown;
            message?: string;
            id?: string;
            hasCv?: boolean;
          };
          try {
            event = JSON.parse(line);
          } catch {
            // Ligne corrompue (coupure au milieu d'un chunk réseau, improbable
            // mais pas impossible) : on l'ignore plutôt que de tout casser.
            continue;
          }

          switch (event.type) {
            case "generationId":
              if (typeof event.id === "string") {
                // Le serveur ne reutilise reusableGenerationId que si la
                // fiche de poste soumise correspond bien a celle deja
                // associee a cette generation payee (voir
                // app/api/generate/route.ts). Un id different renvoye ici
                // signifie qu'il a plutot cree une nouvelle generation non
                // payee : on corrige l'optimisme de paid=true pose au debut
                // de handleGenerate, sinon l'UI resterait a tort deverrouillee
                // (export PDF notamment, qui n'a aucun garde-fou serveur).
                if (event.id !== reusableGenerationId) {
                  setPaid(false);
                }
                capturedGenerationId = event.id;
                setGenerationId(event.id);
                storeGenerationId(event.id);
              }
              break;
            case "analyse":
              setAnalyse(event.data as Analyse);
              break;
            case "question":
              setQuestions((prev) => [...(prev ?? []), event.data as Question]);
              break;
            case "aPoser":
              setQuestionsAPoser((prev) => [...(prev ?? []), event.data as QuestionAPoser]);
              break;
            case "done":
              receivedDone = true;
              setHasCv(Boolean(event.hasCv));
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

        // Popup automatique de conversion : une seule fois par generation
        // (jamais si deja vue, y compris apres un rechargement de page —
        // voir app/lib/unlock-modal-seen.ts). paid est necessairement false
        // ici : le paiement ne peut arriver qu'apres, via /api/checkout,
        // qui exige un generationId deja existant.
        if (capturedGenerationId && !hasSeenUnlockModal(capturedGenerationId)) {
          const idToShow = capturedGenerationId;
          setTimeout(() => {
            markUnlockModalSeen(idToShow);
            setIsAutoPopup(true);
            setUnlockModalOpen(true);
          }, AUTO_UNLOCK_MODAL_DELAY_MS);
        }
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
      // Si le controller a ete aborte, c'est notre propre timeout qui a
      // coupe la requete (aucun "done" recu a temps) : message dedie plutot
      // que le message generique, les questions deja recues restent affichees.
      setError(controller.signal.aborted ? GENERATION_TIMEOUT_MESSAGE : GENERIC_ERROR_MESSAGE);
    } finally {
      clearTimeout(timeoutId);
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

  function openUnlockModal() {
    setIsAutoPopup(false);
    setUnlockModalOpen(true);
  }

  // Ouvre UnlockModal depuis le formulaire de generation (boutons "8"/"12
  // questions" ou "Génération gratuite déjà utilisée" verrouillés), avant
  // toute génération. Reutilise le generationId existant s'il y en a un
  // (cas courant : une génération gratuite a déjà eu lieu — payer débloque
  // aussi son feedback/CV/PDF en plus de lever le plafond de questions).
  // Sinon (rare : generationId perdu), cree une ligne vide via
  // /api/generation-placeholder juste pour avoir un id valide a payer.
  async function openUnlockModalForLockedForm() {
    if (!generationId) {
      try {
        const res = await fetch("/api/generation-placeholder", { method: "POST" });
        const data: { id?: string; error?: string } = await res.json().catch(() => ({}));
        if (!res.ok || !data.id) {
          setError(data.error ?? GENERIC_ERROR_MESSAGE);
          return;
        }
        setGenerationId(data.id);
        storeGenerationId(data.id);
      } catch {
        setError(GENERIC_ERROR_MESSAGE);
        return;
      }
    }
    openUnlockModal();
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
              <div className="grid grid-cols-3 gap-2">
                {QUESTION_COUNT_OPTIONS.map((count) => {
                  // Essai gratuit limité à 5 questions — voir app/lib/free-trial.ts.
                  // Débloqué dès que la génération en cours est payée (jamais
                  // un flag "à vie" sur l'appareil) — voir isLocked plus haut.
                  const optionDisabled =
                    !paid && (trialUsed || count !== FREE_TRIAL_QUESTION_COUNT);
                  // "8"/"12" ne sont jamais gratuits, meme sur un appareil
                  // neuf n'ayant jamais utilise son essai gratuit : le clic
                  // ouvre directement la modale de paiement plutot que de ne
                  // rien faire. "5" n'est jamais concerne ici (voir isLocked
                  // et le bouton "Generer" plus bas pour la reutilisation de
                  // l'essai gratuit deja consomme).
                  const opensUnlockModal = !paid && count !== FREE_TRIAL_QUESTION_COUNT;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={
                        opensUnlockModal
                          ? openUnlockModalForLockedForm
                          : () => setQuestionCount(count)
                      }
                      disabled={optionDisabled && !opensUnlockModal}
                      aria-pressed={questionCount === count}
                      title={opensUnlockModal ? "Débloque l'accès complet pour générer plus de questions" : undefined}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        questionCount === count && !isLocked
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-white/15 bg-transparent text-slate-300 hover:border-white/30 hover:bg-white/5"
                      } ${
                        optionDisabled
                          ? opensUnlockModal
                            ? "cursor-pointer opacity-40 hover:opacity-60"
                            : "cursor-not-allowed opacity-40 hover:border-white/15 hover:bg-transparent"
                          : ""
                      }`}
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
              onClick={isLocked ? openUnlockModalForLockedForm : handleGenerate}
              disabled={isLocked ? false : !canSubmit || loading}
              className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold shadow-[0_0_35px_-8px_rgba(16,185,129,0.7)] transition active:scale-[0.99] ${
                isLocked
                  ? "cursor-pointer bg-white/10 text-slate-300 shadow-none hover:bg-white/15"
                  : "bg-emerald-500 text-navy-950 hover:scale-[1.015] hover:bg-emerald-400 hover:shadow-[0_0_45px_-6px_rgba(16,185,129,0.85)] disabled:cursor-not-allowed disabled:scale-100 disabled:bg-white/10 disabled:text-slate-500 disabled:shadow-none"
              }`}
            >
              {loading ? (
                <>
                  <SpinnerIcon className="h-4 w-4" />
                  Génération en cours…
                </>
              ) : isLocked ? (
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

      {isLocked && questions === null && (
        <main className="mx-auto max-w-4xl px-4 pb-16 pt-10">
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
              <Lock className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-navy-900">
              Tu as testé gratuitement CandiView
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Pour continuer, choisis la formule qui te correspond :
            </p>

            <div className="mt-5 space-y-2 text-left">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm">
                <span className="text-slate-700">
                  <span className="font-semibold text-navy-900">Fiche unique</span> — débloque
                  cette candidature
                </span>
                <span className="flex-none font-semibold text-navy-900">3,99 €</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
                <span className="text-slate-700">
                  <span className="font-semibold text-navy-900">Illimité</span> — toutes tes
                  candidatures
                </span>
                <span className="flex-none font-semibold text-emerald-700">9,99 € / mois</span>
              </div>
            </div>

            <Link
              href="/tarifs"
              className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-navy-950 shadow-[0_0_25px_-8px_rgba(16,185,129,0.7)] transition hover:scale-[1.015] hover:bg-emerald-400"
            >
              Voir les tarifs
            </Link>
          </div>
        </main>
      )}

      {questions !== null && (
        <main ref={resultsRef} className="mx-auto max-w-4xl scroll-mt-20 px-4 pb-16 pt-10">
          {showPaymentConfirmation && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
              <CheckIcon className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
              <p className="flex-1">
                Paiement confirmé — le feedback IA, l&apos;analyse de CV et l&apos;export PDF sont
                débloqués pour cette fiche de poste. Une nouvelle fiche de poste nécessitera un
                nouveau paiement de 3,99&nbsp;€.
              </p>
              <button
                type="button"
                onClick={() => setShowPaymentConfirmation(false)}
                aria-label="Fermer"
                className="flex-none text-emerald-700 transition hover:text-emerald-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <ResultsActionBar
            questions={questions}
            questionsAPoser={questionsAPoser}
            analyse={analyse}
            disabled={loading}
            generationId={generationId}
            paid={paid}
            onUnlockClick={openUnlockModal}
          />

          {analyse && <AnalyseCard analyse={analyse} />}

          <ResultsTabs
            key={resultId}
            questions={questions}
            analyse={analyse}
            hasCv={hasCv}
            questionsAPoser={questionsAPoser}
            expectedQuestionCount={questionCount}
            isStreaming={loading}
            generationId={generationId}
            paid={paid}
            onUnlockClick={openUnlockModal}
          />
        </main>
      )}

      <UnlockModal
        open={unlockModalOpen}
        onClose={() => setUnlockModalOpen(false)}
        generationId={generationId}
        secondaryLabel={isAutoPopup ? "Continuer avec mes 5 questions gratuites" : "Plus tard"}
      />

      <SiteFooter />
    </div>
  );
}
