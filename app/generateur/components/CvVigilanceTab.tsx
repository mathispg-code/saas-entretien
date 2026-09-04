import { AlertTriangle, MessageSquare } from "lucide-react";
import { LightbulbIcon } from "../../components/icons";
import { ConseilRow } from "./shared";
import type { CvVigilancePoint } from "../types";

export function CvVigilanceTab({ points }: { points: CvVigilancePoint[] }) {
  return (
    <section>
      <div className="mb-4 inline-flex animate-fade-in items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
        <AlertTriangle className="h-4 w-4" />
        Points de vigilance sur ton CV
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
