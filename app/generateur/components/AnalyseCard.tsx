import { DocumentIcon } from "../../components/icons";
import type { Analyse } from "../types";

export function AnalyseCard({ analyse }: { analyse: Analyse }) {
  return (
    <div className="mb-6 animate-fade-in rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-navy-700">
        <DocumentIcon className="h-4 w-4 text-emerald-500" />
        Analyse du poste
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
            Compétences clés
          </p>
          <div className="flex flex-wrap gap-1.5">
            {analyse.competencesCles.map((c) => (
              <span
                key={c}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
            Niveau de séniorité
          </p>
          <p className="text-sm text-slate-700">{analyse.niveauSeniorite}</p>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
            Responsabilités principales
          </p>
          <ul className="list-inside list-disc space-y-0.5 text-sm text-slate-700">
            {analyse.responsabilitesPrincipales.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
        {analyse.signauxDistinctifs.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              Signaux distinctifs
            </p>
            <ul className="list-inside list-disc space-y-0.5 text-sm text-slate-700">
              {analyse.signauxDistinctifs.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
