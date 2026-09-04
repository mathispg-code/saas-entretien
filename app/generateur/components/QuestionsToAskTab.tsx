import { MessageSquare } from "lucide-react";
import { LightbulbIcon } from "../../components/icons";
import { ConseilRow } from "./shared";
import type { QuestionAPoser } from "../types";

export function QuestionsToAskTab({ items }: { items: QuestionAPoser[] }) {
  return (
    <section>
      <div className="mb-4 inline-flex animate-fade-in items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">
        <MessageSquare className="h-4 w-4" />
        Questions à poser au recruteur
      </div>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div
            key={i}
            style={{ animationDelay: `${i * 60}ms` }}
            className="animate-fade-in-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm [animation-fill-mode:backwards] sm:p-6"
          >
            <p className="font-semibold text-slate-900 sm:text-lg">{item.question}</p>
            <div className="mt-3 space-y-2 rounded-lg border-l-4 border-sky-400 bg-sky-50 p-3 sm:p-4">
              <ConseilRow
                icon={LightbulbIcon}
                label="Pourquoi la poser"
                text={item.pourquoi}
                accentClassName="text-sky-600"
                labelClassName="text-sky-700"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
