import { AlertCircle, Compass, MessageSquare, Sparkles, Target } from "lucide-react";
import { CheckIcon, LightbulbIcon, SpinnerIcon } from "../../components/icons";
import { ConseilRow, FeedbackList } from "./shared";
import { CATEGORY_LABELS, CATEGORY_STYLES, MAX_ANSWER_LENGTH } from "../types";
import type { AnswerState, Question } from "../types";

export function QuestionCard({
  index,
  question,
  isMastered,
  onToggleMastered,
  answerState,
  onShowAnswerBox,
  onAnswerChange,
  onSubmitFeedback,
}: {
  index: number;
  question: Question;
  isMastered: boolean;
  onToggleMastered: () => void;
  answerState: AnswerState;
  onShowAnswerBox: () => void;
  onAnswerChange: (text: string) => void;
  onSubmitFeedback: () => void;
}) {
  return (
    <div
      style={{ animationDelay: `${index * 60}ms` }}
      className="animate-fade-in-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm [animation-fill-mode:backwards] transition hover:shadow-md sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3 sm:gap-4">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-navy-600 text-sm font-bold text-white sm:h-9 sm:w-9">
            {index + 1}
          </span>
          <div className="pt-0.5">
            <span
              className={`mb-1.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${CATEGORY_STYLES[question.categorie]}`}
            >
              {CATEGORY_LABELS[question.categorie]}
            </span>
            <p className="font-semibold text-slate-900 sm:text-lg">{question.question}</p>
          </div>
        </div>
        <label className="flex flex-none cursor-pointer select-none items-center gap-1.5 pt-1">
          <input
            type="checkbox"
            checked={isMastered}
            onChange={onToggleMastered}
            className="h-4 w-4 cursor-pointer rounded accent-emerald-500"
          />
          <span className="hidden text-xs text-slate-400 sm:inline">Maîtrisée</span>
        </label>
      </div>

      <div className="ml-11 mt-3 space-y-2 rounded-lg border-l-4 border-emerald-500 bg-emerald-50 p-3 sm:ml-[52px] sm:p-4">
        <ConseilRow icon={Target} label="Ce que ça évalue" text={question.conseil.objectif} />
        <ConseilRow icon={LightbulbIcon} label="Conseil" text={question.conseil.conseil} />
        <ConseilRow icon={Compass} label="Astuce" text={question.astuce} />
      </div>

      <div className="ml-11 mt-3 sm:ml-[52px]">
        {!answerState.showBox ? (
          <button
            type="button"
            onClick={onShowAnswerBox}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-navy-700 transition hover:border-emerald-300 hover:text-emerald-700"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Répondre à cette question
          </button>
        ) : (
          <div>
            <textarea
              value={answerState.text}
              onChange={(e) => onAnswerChange(e.target.value.slice(0, MAX_ANSWER_LENGTH))}
              placeholder="Rédige ta réponse ici…"
              rows={4}
              className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
            />
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <span
                className={`text-xs ${
                  answerState.text.length >= MAX_ANSWER_LENGTH
                    ? "font-medium text-rose-500"
                    : "text-slate-400"
                }`}
              >
                {answerState.text.length} / {MAX_ANSWER_LENGTH}
              </span>
              <button
                type="button"
                onClick={onSubmitFeedback}
                disabled={!answerState.text.trim() || answerState.loading}
                className="inline-flex flex-none items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-navy-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                {answerState.loading ? (
                  <>
                    <SpinnerIcon className="h-3.5 w-3.5" />
                    Analyse en cours…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Obtenir un feedback
                  </>
                )}
              </button>
            </div>

            {answerState.error && (
              <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-600">
                {answerState.error}
              </p>
            )}

            {answerState.result && (
              <div className="mt-3 rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F2E4C] to-[#050B14] p-4 shadow-lg sm:p-5">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Feedback sur ta réponse
                </div>
                <div className="space-y-3">
                  <FeedbackList
                    icon={CheckIcon}
                    iconClassName="text-emerald-400"
                    label="Points forts"
                    items={answerState.result.pointsForts}
                  />
                  <FeedbackList
                    icon={AlertCircle}
                    iconClassName="text-amber-400"
                    label="À améliorer"
                    items={answerState.result.pointsAAmeliorer}
                  />
                  {answerState.result.structureStar && (
                    <div className="flex gap-2">
                      <Target className="mt-0.5 h-3.5 w-3.5 flex-none text-sky-300" />
                      <p className="text-sm text-slate-200">
                        <span className="font-semibold text-sky-300">
                          Méthode STAR{" "}
                          {answerState.result.structureStar.respectee
                            ? "respectée"
                            : "non respectée"}{" "}
                          :{" "}
                        </span>
                        {answerState.result.structureStar.commentaire}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <LightbulbIcon className="mt-0.5 h-3.5 w-3.5 flex-none text-emerald-400" />
                    <p className="text-sm text-slate-200">
                      <span className="font-semibold text-emerald-300">Suggestion : </span>
                      {answerState.result.suggestion}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
