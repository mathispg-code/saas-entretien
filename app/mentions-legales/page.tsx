import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales — CandiView",
};

const CONTACT_EMAIL = "contact@candiview.fr";

export default function MentionsLegales() {
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
          Mentions légales
        </h1>

        <div className="mt-8 space-y-8 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700 shadow-sm sm:p-8">
          <section>
            <h2 className="text-base font-semibold text-navy-800">Éditeur du site</h2>
            <p className="mt-2">
              Le site candiview.fr (nom commercial : CandiView) est édité par :<br />
              Mathis Pichon-Girodie, entrepreneur individuel (micro-entrepreneur)
              <br />
              SIREN : 109 791 426
              <br />
              SIRET : 109 791 426 00017
              <br />
              Immatriculé au RCS de Paris, n° 109 791 426
              <br />
              Adresse : 173 rue de Courcelles, 75017 Paris
              <br />
              Email :{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-emerald-600 underline hover:text-emerald-700"
              >
                {CONTACT_EMAIL}
              </a>
              <br />
              TVA non applicable, article 293 B du CGI.
            </p>
            <p className="mt-3">
              Directeur de la publication : Mathis Pichon-Girodie
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">Hébergement</h2>
            <p className="mt-2">
              Le site est hébergé par :<br />
              Vercel Inc.
              <br />
              440 N Barranca Ave #4133, Covina, CA 91723, États-Unis
              <br />
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-emerald-600 underline hover:text-emerald-700"
              >
                https://vercel.com
              </a>
            </p>
            <p className="mt-3">Le nom de domaine candiview.fr est enregistré chez IONOS.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              Propriété intellectuelle
            </h2>
            <p className="mt-2">
              Les contenus du site (textes, graphismes, logo), la marque CandiView
              et le code source appartiennent à l&apos;éditeur. Toute reproduction,
              représentation ou réutilisation, totale ou partielle, sans son
              autorisation écrite préalable est interdite.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              Limitation de responsabilité
            </h2>
            <p className="mt-2">
              CandiView est un outil d&apos;aide à la préparation aux entretiens
              d&apos;embauche. Les questions et conseils sont générés par
              intelligence artificielle : ils sont fournis à titre indicatif et
              peuvent contenir des inexactitudes. L&apos;éditeur ne garantit
              aucun résultat en entretien, ni l&apos;obtention d&apos;un emploi.
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

          <section>
            <h2 className="text-base font-semibold text-navy-800">Contact</h2>
            <p className="mt-2">
              Pour toute question, écris-nous à{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-emerald-600 underline hover:text-emerald-700"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
