import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — EntretienIA",
};

export default function Confidentialite() {
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
          Politique de confidentialité
        </h1>

        <div className="mt-8 space-y-8 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700 shadow-sm sm:p-8">
          <section>
            <h2 className="text-base font-semibold text-navy-800">
              Aucun stockage de vos documents
            </h2>
            <p className="mt-2">
              La fiche de poste et le CV que tu fournis (texte collé ou
              fichier PDF importé) ne sont jamais enregistrés, ni sur un
              serveur, ni dans une base de données. Ils sont transmis
              directement à l&apos;API de génération et traités uniquement en
              mémoire, le temps de produire ta liste de questions. Une fois la
              réponse renvoyée, ce contenu n&apos;est conservé nulle part.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              Aucun compte, aucune base de données
            </h2>
            <p className="mt-2">
              Ce site ne demande pas de créer de compte et ne dispose pas de
              base de données utilisateurs. Aucune donnée personnelle
              (identité, email, historique de générations) n&apos;est
              collectée ou conservée par nos soins.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              Stockage local de ton navigateur
            </h2>
            <p className="mt-2">
              Une seule information technique est conservée localement, dans
              le stockage de ton navigateur (localStorage) : le fait que tu
              aies déjà utilisé ta génération gratuite. Cette information ne
              quitte jamais ton appareil, n&apos;est pas transmise à nos
              serveurs, et ne contient aucune donnée personnelle. Tu peux la
              supprimer à tout moment en vidant les données de ton navigateur
              pour ce site.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              Partage avec des tiers
            </h2>
            <p className="mt-2">
              Le contenu que tu soumets est transmis uniquement à
              l&apos;API d&apos;Anthropic (Claude), nécessaire pour générer
              les questions d&apos;entretien. Aucune autre transmission à un
              tiers n&apos;est effectuée : pas de revente de données, pas de
              publicité, pas d&apos;outils de suivi ou d&apos;analytics.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">Contact</h2>
            <p className="mt-2">
              Pour toute question relative à cette politique de
              confidentialité, tu peux nous contacter à l&apos;adresse
              indiquée dans les{" "}
              <Link
                href="/mentions-legales"
                className="font-medium text-emerald-600 underline hover:text-emerald-700"
              >
                mentions légales
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
