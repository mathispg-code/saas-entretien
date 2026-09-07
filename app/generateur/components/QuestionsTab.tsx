"use client";

import { useState } from "react";
import { CheckIcon, SpinnerIcon } from "../../components/icons";
import { QuestionCard } from "./QuestionCard";
import { UnlockBanner } from "./UnlockBanner";
import {
  DEFAULT_ANSWER_STATE,
  FEEDBACK_TIMEOUT_MS,
  GENERIC_ERROR_MESSAGE,
} from "../types";
import type { AnswerState, Analyse, FeedbackResult, Question } from "../types";

export function QuestionsTab({
  questions,
  analyse,
  expectedQuestionCount,
  isStreaming,
  generationId,
  paid,
}: {
  questions: Question[];
  analyse: Analyse | null;
  expectedQuestionCount: number;
  isStreaming: boolean;
  generationId: string | null;
  paid: boolean;
}) {
  const [mastered, setMastered] = useState<Set<number>>(new Set());
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});

  function toggleMastered(index: number) {
    setMastered((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function updateAnswer(index: number, patch: Partial<AnswerState>) {
    setAnswers((prev) => ({
      ...prev,
      [index]: { ...(prev[index] ?? DEFAULT_ANSWER_STATE), ...patch },
    }));
  }

  async function handleFeedback(index: number, question: Question) {
    // Garde-fou : l'UI empêche déjà cet appel tant que paid est false (voir
    // le rendu de QuestionCard ci-dessous), on protège aussi la fonction.
    if (!paid) {
      return;
    }
    const state = answers[index] ?? DEFAULT_ANSWER_STATE;
    const answerText = state.text.trim();
    if (!answerText || state.loading) {
      return;
    }

    updateAnswer(index, { loading: true, error: null, result: null });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FEEDBACK_TIMEOUT_MS);

      let res: Response;
      try {
        res = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: question.question,
            categorie: question.categorie,
            answer: answerText,
            jobContext: analyse,
            generationId,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      let data: FeedbackResult & { error?: string };
      try {
        data = await res.json();
      } catch {
        updateAnswer(index, { loading: false, error: GENERIC_ERROR_MESSAGE });
        return;
      }

      if (!res.ok) {
        updateAnswer(index, { loading: false, error: data.error ?? GENERIC_ERROR_MESSAGE });
        return;
      }

      if (!data.pointsForts || !data.pointsAAmeliorer || !data.suggestion) {
        updateAnswer(index, { loading: false, error: GENERIC_ERROR_MESSAGE });
        return;
      }

      updateAnswer(index, {
        loading: false,
        result: {
          pointsForts: data.pointsForts,
          pointsAAmeliorer: data.pointsAAmeliorer,
          structureStar: data.structureStar,
          suggestion: data.suggestion,
        },
      });
    } catch {
      updateAnswer(index, { loading: false, error: GENERIC_ERROR_MESSAGE });
    }
  }

  return (
    <section>
      <div className="mb-4 inline-flex animate-fade-in items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
        {isStreaming ? (
          <>
            <SpinnerIcon className="h-4 w-4" />
            {questions.length}/{expectedQuestionCount} questions reçues…
          </>
        ) : (
          <>
            <CheckIcon className="h-4 w-4" />
            {questions.length} questions générées
          </>
        )}
      </div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy-800">Vos questions d&apos;entretien</h2>
        <span className="text-sm font-medium text-slate-500">
          {mastered.size}/{questions.length} questions maîtrisées
        </span>
      </div>

      {!paid && !isStreaming && (
        <div className="mb-6">
          <UnlockBanner
            generationId={generationId}
            description="Réponds à chaque question et reçois un feedback personnalisé de l'IA sur tes réponses."
          />
        </div>
      )}

      <div className="space-y-4">
        {questions.map((q, i) => (
          <QuestionCard
            key={i}
            index={i}
            question={q}
            isMastered={mastered.has(i)}
            onToggleMastered={() => toggleMastered(i)}
            answerState={answers[i] ?? DEFAULT_ANSWER_STATE}
            onShowAnswerBox={() => updateAnswer(i, { showBox: true })}
            onAnswerChange={(text) => updateAnswer(i, { text })}
            onSubmitFeedback={() => handleFeedback(i, q)}
            locked={!paid}
          />
        ))}
      </div>
    </section>
  );
}
