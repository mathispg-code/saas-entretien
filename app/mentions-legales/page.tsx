import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales — EntretienIA",
};

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-navy-900 px-4 py-4">
        <div className="mx-auto max-w-3xl">
          <Link href="/" className="text-lg font-bold tracking-tight text-white">
            Entretien<span className="text-emerald-400">IA</span>
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
          Mentions légales
        </h1>

        <div className="mt-8 space-y-8 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700 shadow-sm sm:p-8">
          <section>
            <h2 className="text-base font-semibold text-navy-800">Éditeur du site</h2>
            <p className="mt-2">
              Le présent site est édité par :<br />
              [Ton nom et prénom]
              <br />
              Statut : [Ton statut juridique — ex : entrepreneur individuel,
              auto-entrepreneur, particulier]
              <br />
              Adresse : [Ton adresse postale]
              <br />
              Numéro SIRET : [Ton numéro SIRET, le cas échéant]
              <br />
              Email de contact : [Ton email de contact]
              <br />
              Téléphone : [Ton numéro de téléphone — optionnel]
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              Directeur de la publication
            </h2>
            <p className="mt-2">[Ton nom et prénom]</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">Hébergement</h2>
            <p className="mt-2">
              Ce site est hébergé par :<br />
              [Nom de l&apos;hébergeur, ex : Vercel Inc.]
              <br />
              [Adresse de l&apos;hébergeur]
              <br />
              [Site web de l&apos;hébergeur]
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              Propriété intellectuelle
            </h2>
            <p className="mt-2">
              L&apos;ensemble des éléments (textes, graphismes, logo) présents
              sur ce site relève de la législation sur la propriété
              intellectuelle. Toute reproduction non autorisée est interdite.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              Utilisation d&apos;un service tiers
            </h2>
            <p className="mt-2">
              La génération de questions repose sur l&apos;API d&apos;Anthropic
              (Claude). Voir notre{" "}
              <Link
                href="/confidentialite"
                className="font-medium text-emerald-600 underline hover:text-emerald-700"
              >
                politique de confidentialité
              </Link>{" "}
              pour le détail du traitement des données.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
