import Link from "next/link";
import type { Metadata } from "next";
import { CGV_VERSION, getCgvEntry, isCgvEntryIntact } from "../lib/cgv";
import { CgvDocumentView, CgvInlines } from "./CgvDocumentView";

export const metadata: Metadata = {
  title: "Conditions générales de vente — CandiView",
};

export default function Cgv() {
  // /cgv affiche toujours la version en vigueur (derniere du registre).
  const entry = getCgvEntry(CGV_VERSION);
  if (!entry) {
    throw new Error("Version des CGV en vigueur introuvable dans le registre.");
  }
  if (!isCgvEntryIntact(entry)) {
    // N'empeche pas l'affichage : signale une modification d'une version figee.
    console.error(`CGV ${entry.version} : le contenu ne correspond plus à l'empreinte figée.`);
  }
  const document = entry.document;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-navy-900 px-4 py-4">
        <div className="mx-auto max-w-3xl">
          <Link href="/" className="text-lg font-bold tracking-tight text-white">
            Candi<span className="text-emerald-400">View</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <Link
          href="/"
          className="text-sm font-medium text-navy-600 hover:text-navy-800"
        >
          ← Retour à l&apos;accueil
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-navy-900 sm:text-3xl">
          {document.title}
        </h1>
        {document.notice && (
          <p className="mt-3 text-sm text-slate-600">
            <CgvInlines items={document.notice} />
          </p>
        )}

        <CgvDocumentView document={document} />
      </main>
    </div>
  );
}
