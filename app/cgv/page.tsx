import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions générales de vente — CandiView",
};

const CONTACT_EMAIL = "contact@candiview.fr";

// Marqueur visible pour tout passage encore a completer ou a faire valider
// par un juriste avant l'ouverture au public (voir TODO.md).
function Mark({ kind, label }: { kind: "À COMPLÉTER" | "À FAIRE VALIDER"; label: string }) {
  return (
    <mark className="rounded bg-amber-100 px-1 font-semibold text-amber-800">
      [{kind} : {label}]
    </mark>
  );
}

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
        <p className="mt-3 text-sm text-slate-600">
          <Mark
            kind="À FAIRE VALIDER"
            label="version brouillon incluant le Pass hebdomadaire et l'abonnement Illimité, à relire par un juriste avant ouverture au public"
          />
        </p>

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
            <h2 className="text-base font-semibold text-navy-800">3. Offres</h2>
            <p className="mt-2">
              La première génération de 5 questions, ainsi que les questions à
              poser au recruteur, sont gratuites et sans compte.
            </p>

            <h3 className="mt-4 font-semibold text-navy-800">3.1 Fiche unique</h3>
            <p className="mt-2">
              Le pack Fiche unique à 3,99 € (paiement unique, par fiche de poste
              / génération) débloque :
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>le feedback sur chaque question ;</li>
              <li>l&apos;analyse des points faibles du CV ;</li>
              <li>l&apos;export PDF ;</li>
              <li>les options à 8 et 12 questions.</li>
            </ul>
            <p className="mt-3">
              Le pack s&apos;applique uniquement à la génération pour laquelle
              il est acheté. S&apos;il est acheté avant toute génération, il
              s&apos;applique à la prochaine génération réalisée. Une nouvelle
              fiche de poste nécessite un nouveau pack.
            </p>

            <h3 className="mt-4 font-semibold text-navy-800">3.2 Pass hebdomadaire</h3>
            <p className="mt-2">
              Le Pass hebdomadaire à 6,99 € (paiement unique, sans reconduction)
              donne un accès illimité pendant 7 jours à compter du paiement : sur
              chaque fiche de poste générée pendant cette période, le feedback,
              l&apos;analyse des points faibles du CV, l&apos;export PDF et les
              options jusqu&apos;à 12 questions sont inclus, dans la limite de
              l&apos;usage raisonnable décrit à l&apos;article 6. À l&apos;issue des 7
              jours, l&apos;accès s&apos;arrête automatiquement ; il n&apos;y a aucun
              nouveau prélèvement.
            </p>

            <h3 className="mt-4 font-semibold text-navy-800">3.3 Illimité (abonnement)</h3>
            <p className="mt-2">
              L&apos;offre Illimité à 9,99 € par mois est un abonnement mensuel
              qui donne un accès illimité aux mêmes fonctionnalités, pour toutes
              les fiches de poste, dans la limite de l&apos;usage raisonnable
              décrit à l&apos;article 6. Il se renouvelle chaque mois jusqu&apos;à
              sa résiliation (article 5).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">4. Prix et TVA</h2>
            <p className="mt-2">
              Le pack Fiche unique est vendu 3,99 €, le Pass hebdomadaire 6,99 €
              et l&apos;abonnement Illimité 9,99 € par mois. Prix en euros,
              toutes taxes comprises. TVA non applicable, article 293 B du CGI.
            </p>
            <p className="mt-3">
              Paiement : il est réalisé en ligne, de manière sécurisée, par
              l&apos;intermédiaire de Stripe. L&apos;éditeur ne conserve aucune
              donnée de carte bancaire. Pour l&apos;abonnement, le prélèvement est
              renouvelé automatiquement chaque mois sur le moyen de paiement
              enregistré auprès de Stripe.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              5. Durée, renouvellement et résiliation
            </h2>
            <p className="mt-2">
              <strong>Pack Fiche unique et Pass hebdomadaire</strong> : paiement
              unique, sans reconduction. Le Pass hebdomadaire prend fin
              automatiquement 7 jours après le paiement.
            </p>
            <p className="mt-3">
              <strong>Abonnement Illimité</strong> : conclu pour une durée d&apos;un
              mois, il est renouvelé tacitement chaque mois jusqu&apos;à
              résiliation. L&apos;abonné peut le résilier à tout moment, en ligne,
              en un clic, depuis le lien «&nbsp;Gérer mon abonnement&nbsp;» de la
              page du générateur (portail de gestion sécurisé de Stripe), sans
              avoir à contacter l&apos;éditeur. La résiliation prend effet à la fin
              de la période mensuelle en cours, déjà payée : l&apos;accès est
              conservé jusqu&apos;à cette date et aucun nouveau prélèvement
              n&apos;a lieu ensuite.
            </p>
            <p className="mt-3">
              <strong>Échec de paiement</strong> : si un prélèvement mensuel
              échoue, l&apos;accès est conservé pendant que Stripe retente
              automatiquement le paiement. Si le paiement n&apos;aboutit pas,
              l&apos;abonnement est résilié et l&apos;accès est coupé. L&apos;abonné
              peut à tout moment mettre à jour sa carte bancaire via «&nbsp;Gérer
              mon abonnement&nbsp;».
            </p>
            <p className="mt-3">
              <Mark
                kind="À COMPLÉTER"
                label="règle de remboursement éventuel d'un mois entamé, et information du consommateur avant chaque reconduction tacite"
              />{" "}
              <Mark
                kind="À FAIRE VALIDER"
                label="obligations légales applicables à la reconduction tacite et à la résiliation en ligne"
              />
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              6. Usage raisonnable
            </h2>
            <p className="mt-2">
              Les offres Pass hebdomadaire et Illimité donnent droit à des
              générations illimitées dans le cadre d&apos;un usage personnel
              normal, pour préparer ses propres entretiens. En cas d&apos;usage
              manifestement abusif (volume anormalement élevé de générations,
              usage automatisé, partage de l&apos;accès avec des tiers...),
              l&apos;éditeur peut limiter temporairement le nombre de générations,
              sans que cette limitation constitue un manquement de sa part.
            </p>
            <p className="mt-3">
              <Mark
                kind="À COMPLÉTER"
                label="conséquences d'un abus répété (suspension, résiliation) et éventuel seuil indicatif à communiquer"
              />
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">7. Accès au service</h2>
            <p className="mt-2">
              Le service numérique est fourni immédiatement après le paiement.
              Il n&apos;existe pas de compte utilisateur : l&apos;accès est lié
              à l&apos;appareil et au navigateur utilisés lors de l&apos;achat
              (stockage local). Changer d&apos;appareil, vider les données du
              navigateur ou utiliser la navigation privée peut entraîner la
              perte de l&apos;accès.
            </p>
            <p className="mt-3">
              Pour le Pass hebdomadaire et l&apos;abonnement Illimité, l&apos;accès
              est rattaché à l&apos;adresse email saisie lors du paiement et à
              l&apos;appareil utilisé lors de l&apos;achat, grâce à un cookie
              strictement nécessaire au service (voir la{" "}
              <Link
                href="/confidentialite"
                className="font-medium text-emerald-600 underline hover:text-emerald-700"
              >
                politique de confidentialité
              </Link>
              ).
            </p>
            <p className="mt-3">
              En cas de changement d&apos;appareil ou de perte du cookie, l&apos;accès
              peut être retrouvé depuis la page «&nbsp;Mon accès&nbsp;» : un lien à
              usage unique, valable 15 minutes, est envoyé à l&apos;adresse email
              saisie lors du paiement. L&apos;accès est alors activé sur le nouvel
              appareil et désactivé sur le précédent (un seul appareil à la fois).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              8. Droit de rétractation
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
            <p className="mt-3">
              Cette même case est présentée avant le paiement du Pass
              hebdomadaire et de l&apos;abonnement Illimité, avec le libellé
              suivant : «&nbsp;J&apos;accepte les CGV et je demande l&apos;exécution
              immédiate du service. Je reconnais perdre mon droit de
              rétractation une fois le service exécuté.&nbsp;»
            </p>
            <p className="mt-3">
              <Mark
                kind="À FAIRE VALIDER"
                label="pour le Pass hebdomadaire et surtout pour l'abonnement mensuel, la perte du droit de rétractation et le sort d'un éventuel remboursement partiel dans les 14 jours dépendent de l'exécution du service : le libellé exact de la case et de cette clause doit être validé par un juriste"
              />
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              9. Nature du service
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
            <h2 className="text-base font-semibold text-navy-800">10. Responsabilité</h2>
            <p className="mt-2">
              La responsabilité de l&apos;éditeur est limitée dans la mesure
              permise par la loi. Cette limitation n&apos;exclut pas les droits
              impératifs du consommateur, notamment la garantie légale de
              conformité.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              11. Propriété intellectuelle
            </h2>
            <p className="mt-2">
              Les contenus générés peuvent être utilisés par l&apos;utilisateur
              pour sa préparation personnelle. Le site, la marque CandiView et
              le code restent la propriété de l&apos;éditeur.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              12. Données personnelles
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
            <h2 className="text-base font-semibold text-navy-800">13. Service client</h2>
            <p className="mt-2">
              Pour toute question ou réclamation : <MailLink />.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              14. Loi applicable et rétractation
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
              15. Dernière mise à jour
            </h2>
            <p className="mt-2">
              6 octobre 2026.{" "}
              <Mark kind="À COMPLÉTER" label="date de mise en vigueur de cette version" />
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
