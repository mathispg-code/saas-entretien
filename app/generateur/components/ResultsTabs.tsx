"use client";

import { useState } from "react";
import { QuestionsTab } from "./QuestionsTab";
import { CvVigilanceTab } from "./CvVigilanceTab";
import { QuestionsToAskTab } from "./QuestionsToAskTab";
import type { Analyse, CvVigilancePoint, Question, QuestionAPoser } from "../types";

type TabKey = "questions" | "cv" | "aposer";

export function ResultsTabs({
  questions,
  analyse,
  cvVigilance,
  questionsAPoser,
  expectedQuestionCount,
  isStreaming,
}: {
  questions: Question[];
  analyse: Analyse | null;
  cvVigilance: CvVigilancePoint[] | null;
  questionsAPoser: QuestionAPoser[] | null;
  expectedQuestionCount: number;
  isStreaming: boolean;
}) {
  const hasCvTab = Boolean(cvVigilance && cvVigilance.length > 0);
  const hasAPoserTab = Boolean(questionsAPoser && questionsAPoser.length > 0);
  const [activeTab, setActiveTab] = useState<TabKey>("questions");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "questions", label: "Questions d'entretien" },
    ...(hasCvTab ? [{ key: "cv" as const, label: "Mon CV" }] : []),
    ...(hasAPoserTab ? [{ key: "aposer" as const, label: "Questions à poser" }] : []),
  ];

  return (
    <div>
      {tabs.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              aria-pressed={activeTab === key}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === key
                  ? "bg-navy-700 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {activeTab === "questions" && (
        <QuestionsTab
          questions={questions}
          analyse={analyse}
          expectedQuestionCount={expectedQuestionCount}
          isStreaming={isStreaming}
        />
      )}
      {activeTab === "cv" && hasCvTab && <CvVigilanceTab points={cvVigilance!} />}
      {activeTab === "aposer" && hasAPoserTab && (
        <QuestionsToAskTab items={questionsAPoser!} />
      )}
    </div>
  );
}
