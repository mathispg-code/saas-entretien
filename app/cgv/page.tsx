import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions générales de vente — CandiView",
};

const CONTACT_EMAIL = "contact@candiview.fr";

function MailLink() {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="font-medium text-emerald-600 underline hover:text-emerald-700"
    >
      {CONTACT_EMAIL}
    </a>
  );
}

export default function Cgv() {
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
          Conditions générales de vente
        </h1>

        <div className="mt-8 space-y-8 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700 shadow-sm sm:p-8">
          <section>
            <h2 className="text-base font-semibold text-navy-800">1. Éditeur</h2>
            <p className="mt-2">
              Le site candiview.fr est édité par Mathis Pichon-Girodie,
              entrepreneur individuel (micro-entrepreneur), sous le nom
              commercial CandiView.
              <br />
              SIREN : 109 791 426 — RCS Paris
              <br />
              Adresse : 173 rue de Courcelles, 75017 Paris
              <br />
              Email : <MailLink />
              <br />
              TVA non applicable, article 293 B du CGI.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">2. Objet</h2>
            <p className="mt-2">
              Les présentes conditions générales de vente (CGV) régissent la
              vente en ligne d&apos;un accès payant à des fonctionnalités de
              CandiView, outil d&apos;aide à la préparation aux entretiens
              d&apos;embauche.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">3. Offre</h2>
            <p className="mt-2">
              La première génération de 5 questions, ainsi que les questions à
              poser au recruteur, sont gratuites et sans compte.
            </p>
            <p className="mt-3">
              Le pack à 3,99 € (paiement unique, par fiche de poste /
              génération) débloque :
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>le feedback sur chaque question ;</li>
              <li>l&apos;analyse des points faibles du CV ;</li>
              <li>l&apos;export PDF ;</li>
              <li>les options à 8 et 12 questions.</li>
            </ul>
            <p className="mt-3">
              Le pack s&apos;applique uniquement à la génération pour laquelle
              il est acheté. Une nouvelle fiche de poste nécessite un nouveau
              pack.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">4. Prix et TVA</h2>
            <p className="mt-2">
              Le pack est vendu 3,99 €. Prix en euros, toutes taxes comprises.
              TVA non applicable, article 293 B du CGI.
            </p>
            <p className="mt-3">
              Paiement : il est réalisé en ligne, de manière sécurisée, par
              l&apos;intermédiaire de Stripe. L&apos;éditeur ne conserve aucune
              donnée de carte bancaire.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">5. Accès au service</h2>
            <p className="mt-2">
              Le service numérique est fourni immédiatement après le paiement.
              Il n&apos;existe pas de compte utilisateur : l&apos;accès est lié
              à l&apos;appareil et au navigateur utilisés lors de l&apos;achat
              (stockage local). Changer d&apos;appareil, vider les données du
              navigateur ou utiliser la navigation privée peut entraîner la
              perte de l&apos;accès.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              6. Droit de rétractation
            </h2>
            <p className="mt-2">
              Conformément à l&apos;article L221-18 du Code de la consommation,
              le consommateur dispose en principe d&apos;un délai de 14 jours
              pour se rétracter d&apos;un achat conclu à distance.
            </p>
            <p className="mt-3">
              Le pack est un service numérique fourni immédiatement après le
              paiement. Avant de payer, le consommateur coche la case prévue à
              cet effet : il demande ainsi expressément l&apos;exécution
              immédiate du service et reconnaît qu&apos;il perdra son droit de
              rétractation une fois le service pleinement exécuté,
              conformément à l&apos;article L221-28 du Code de la consommation.
              Il renonce en conséquence à son droit de rétractation dans ces
              conditions.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              7. Nature du service
            </h2>
            <p className="mt-2">
              Les questions et les conseils sont générés par intelligence
              artificielle (API d&apos;Anthropic). Ils sont fournis à titre
              indicatif et peuvent contenir des inexactitudes. L&apos;éditeur ne
              garantit aucun résultat en entretien ni l&apos;obtention d&apos;un
              emploi.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">8. Responsabilité</h2>
            <p className="mt-2">
              La responsabilité de l&apos;éditeur est limitée dans la mesure
              permise par la loi. Cette limitation n&apos;exclut pas les droits
              impératifs du consommateur, notamment la garantie légale de
              conformité.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              9. Propriété intellectuelle
            </h2>
            <p className="mt-2">
              Les contenus générés peuvent être utilisés par l&apos;utilisateur
              pour sa préparation personnelle. Le site, la marque CandiView et
              le code restent la propriété de l&apos;éditeur.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              10. Données personnelles
            </h2>
            <p className="mt-2">
              Le traitement des données personnelles est détaillé dans notre{" "}
              <Link
                href="/confidentialite"
                className="font-medium text-emerald-600 underline hover:text-emerald-700"
              >
                politique de confidentialité
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">11. Service client</h2>
            <p className="mt-2">
              Pour toute question ou réclamation : <MailLink />.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              12. Loi applicable et rétractation
            </h2>
            <p className="mt-2">
              Conformément à l&apos;article L221-28, 13° du Code de la
              consommation, le droit de rétractation ne peut être exercé pour
              les contenus numériques fournis sans support matériel dont
              l&apos;exécution a commencé après accord préalable exprès du
              consommateur et renoncement exprès à son droit de rétractation.
            </p>
            <p className="mt-3">
              Les présentes CGV sont soumises au droit français. En cas de
              litige, les tribunaux compétents sont déterminés selon les règles
              légales applicables.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              13. Dernière mise à jour
            </h2>
            <p className="mt-2">6 octobre 2026.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
