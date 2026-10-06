import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — CandiView",
};

const CONTACT_EMAIL = "contact@candiview.fr";

function Mark({ kind, label }: { kind: "À COMPLÉTER" | "À VÉRIFIER"; label: string }) {
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

function Key({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-navy-800">
      {children}
    </code>
  );
}

export default function Confidentialite() {
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
          Politique de confidentialité
        </h1>

        <div className="mt-8 space-y-8 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700 shadow-sm sm:p-8">
          <section>
            <h2 className="text-base font-semibold text-navy-800">
              Responsable du traitement
            </h2>
            <p className="mt-2">
              Mathis Pichon-Girodie, entrepreneur individuel, nom commercial
              CandiView.
              <br />
              173 rue de Courcelles, 75017 Paris
              <br />
              Email : <MailLink />
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">Données traitées</h2>
            <p className="mt-2">
              CandiView ne propose pas de compte utilisateur. Voici les données
              traitées lorsque tu utilises le site :
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong>La fiche de poste et le CV que tu fournis</strong> (texte
                collé ou fichier PDF). Le CV peut contenir des données
                personnelles. Ces documents sont envoyés à Anthropic pour générer
                les questions. Leur contenu n&apos;est pas enregistré dans notre
                base de données.
              </li>
              <li>
                <strong>Les résultats générés sont, eux, enregistrés dans notre
                base de données</strong> : analyse du poste, questions et
                conseils, questions à poser au recruteur et, si tu as fourni un
                CV, l&apos;analyse de ses points de vigilance (qui peut refléter
                des informations de ton CV). Cet enregistrement permet de
                réafficher tes résultats après un rechargement de page ou un
                paiement.
              </li>
              <li>
                <strong>Des informations techniques liées à chaque génération</strong>{" "}
                : un identifiant de génération (identifiant aléatoire), la date de
                création, le statut de paiement, l&apos;identifiant de la session
                de paiement Stripe et une empreinte (hash) de la fiche de poste,
                utilisée pour vérifier qu&apos;un paiement s&apos;applique bien à
                la même fiche de poste. Cette empreinte ne contient pas le texte
                de la fiche de poste.
              </li>
              <li>
                <strong>Les données de paiement</strong> : elles sont saisies sur la
                page de paiement de Stripe (adresse email et données de carte
                bancaire). Nous ne voyons ni ne stockons les données de carte.
                Pour le pack Fiche unique, nous n&apos;enregistrons pas ton adresse
                email dans notre base de données ; elle reste consultable dans
                notre tableau de bord Stripe. Pour le Pass hebdomadaire et
                l&apos;abonnement Illimité, voir la ligne suivante.
              </li>
              <li>
                <strong>Les données d&apos;accès au Pass hebdomadaire et à
                l&apos;abonnement Illimité</strong> : l&apos;adresse email saisie lors du
                paiement, l&apos;offre choisie, son statut (actif, paiement échoué,
                résilié...), ses dates de fin ou de renouvellement, les
                identifiants Stripe du client, de l&apos;abonnement et de la session de
                paiement, et une empreinte (hash) du jeton contenu dans ton cookie
                d&apos;accès (le jeton lui-même n&apos;est pas conservé). Les
                générations réalisées avec cet accès y sont rattachées, pour
                appliquer la limite d&apos;usage raisonnable.
              </li>
              <li>
                <strong>Des statistiques de fréquentation</strong> (voir plus bas,
                « Mesure d&apos;audience »).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              Finalités et bases légales
            </h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                <strong>Fournir le service</strong> (génération des questions,
                réaffichage des résultats, déblocage des fonctionnalités payantes) :
                exécution du contrat (voir les{" "}
                <Link
                  href="/cgv"
                  className="font-medium text-emerald-600 underline hover:text-emerald-700"
                >
                  CGV
                </Link>
                ).
              </li>
              <li>
                <strong>Traiter les paiements</strong> : exécution du contrat.
              </li>
              <li>
                <strong>Gérer ton accès au Pass hebdomadaire ou à l&apos;abonnement
                Illimité</strong> (rattacher l&apos;accès à ton achat, vérifier qu&apos;il
                est valide, gérer le renouvellement et la résiliation) : exécution
                du contrat.
              </li>
              <li>
                <strong>Mesure d&apos;audience</strong> : intérêt légitime de
                connaître la fréquentation du site.{" "}
                <Mark
                  kind="À VÉRIFIER"
                  label="base légale retenue pour la mesure d'audience"
                />
              </li>
              <li>
                <strong>Sécurité du service</strong> (par exemple, vérification du
                paiement côté serveur, limite d&apos;usage raisonnable contre les
                abus) : intérêt légitime.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              Destinataires et sous-traitants
            </h2>
            <p className="mt-2">
              Nous faisons appel aux prestataires suivants. Pour chacun,
              l&apos;indication de la localisation du traitement et des garanties
              de transfert hors Union européenne reste à confirmer.
            </p>
            <ul className="mt-3 list-disc space-y-3 pl-5">
              <li>
                <strong>Anthropic</strong> — génération des questions. Reçoit la
                fiche de poste et le CV que tu fournis.{" "}
                <Mark
                  kind="À VÉRIFIER"
                  label="localisation du traitement, garanties de transfert hors UE, durée de conservation et usage des données par Anthropic pour l'API"
                />
              </li>
              <li>
                <strong>Supabase</strong> — base de données où sont enregistrés les
                résultats, les informations techniques et les données d&apos;accès
                décrites ci-dessus.{" "}
                <Mark
                  kind="À VÉRIFIER"
                  label="région du projet Supabase et garanties de transfert hors UE"
                />
              </li>
              <li>
                <strong>Vercel</strong> — hébergement du site et mesure d&apos;audience
                (Vercel Web Analytics). Vercel Inc. est établie aux États-Unis
                (adresse dans les{" "}
                <Link
                  href="/mentions-legales"
                  className="font-medium text-emerald-600 underline hover:text-emerald-700"
                >
                  mentions légales
                </Link>
                ).{" "}
                <Mark
                  kind="À VÉRIFIER"
                  label="région d'exécution des fonctions et garanties de transfert hors UE"
                />
              </li>
              <li>
                <strong>Stripe</strong> — paiement et gestion de l&apos;abonnement
                (page de paiement, prélèvements mensuels, portail «&nbsp;Gérer mon
                abonnement&nbsp;»). Collecte les données de paiement sur ses propres
                pages ; nous ne voyons ni ne stockons les données de carte
                bancaire.{" "}
                <Mark
                  kind="À VÉRIFIER"
                  label="localisation du traitement et garanties de transfert hors UE"
                />
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              Mesure d&apos;audience (Vercel Web Analytics)
            </h2>
            <p className="mt-2">
              Le site utilise Vercel Web Analytics, chargé sur toutes les pages.
              Selon la documentation de Vercel, il enregistre pour chaque page vue :
              la date, l&apos;adresse de la page, la page de provenance
              (« referrer »), la localisation approximative (pays, région, ville),
              le système d&apos;exploitation, le navigateur et le type d&apos;appareil.
              Les adresses des pages de CandiView ne contiennent aucune donnée
              personnelle.
            </p>
            <p className="mt-3">
              <strong>Cookies et identifiants :</strong> nous avons vérifié que le
              composant utilisé (version 2.0.1) n&apos;écrit ni cookie, ni
              localStorage, ni sessionStorage, ni base locale dans ton navigateur,
              et que la navigation sur le site ne dépose aucun cookie. Le seul
              cookie du site est le cookie d&apos;accès décrit ci-dessous, déposé
              uniquement si tu achètes le Pass hebdomadaire ou l&apos;abonnement
              Illimité.
              D&apos;après Vercel, les visiteurs sont distingués par une empreinte
              calculée à partir de la requête, automatiquement supprimée au bout de
              24 heures.
            </p>
            <p className="mt-3">
              La page de paiement est hébergée par Stripe et relève de la politique
              de Stripe, qui peut y utiliser ses propres cookies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              Stockage local de ton navigateur
            </h2>
            <p className="mt-2">
              Le site enregistre trois informations dans le stockage local
              (localStorage) de ton navigateur. Ce ne sont pas des cookies.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <Key>entretien-ia:free-trial-used</Key> : indique que tu as déjà
                utilisé ta génération gratuite (une par navigateur). Elle reste dans
                ton navigateur.
              </li>
              <li>
                <Key>entretien-ia:last-generation-id</Key> : l&apos;identifiant de ta
                dernière génération. Il sert à réafficher tes résultats et à relier
                ton paiement à la bonne génération. Cet identifiant est envoyé à nos
                serveurs lorsque tu consultes tes résultats, que tu paies ou que tu
                utilises les fonctionnalités débloquées.
              </li>
              <li>
                <Key>entretien-ia:unlock-modal-seen:&lt;identifiant&gt;</Key> :
                indique que la fenêtre de proposition d&apos;achat a déjà été
                affichée pour cette génération, pour ne pas la montrer deux fois.
                Elle reste dans ton navigateur.
              </li>
            </ul>
            <p className="mt-3">
              Comme il n&apos;y a pas de compte, ton accès payant est lié à
              l&apos;appareil et au navigateur utilisés lors de l&apos;achat : à ce
              stockage pour le pack Fiche unique, au cookie d&apos;accès ci-dessous
              pour le Pass hebdomadaire et l&apos;abonnement Illimité. Vider les
              données du navigateur, changer d&apos;appareil ou utiliser la
              navigation privée peut te faire perdre l&apos;accès (voir
              l&apos;article 7 des{" "}
              <Link
                href="/cgv"
                className="font-medium text-emerald-600 underline hover:text-emerald-700"
              >
                CGV
              </Link>
              ). Tu peux supprimer ces informations à tout moment en vidant les
              données du site dans ton navigateur.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              Cookie d&apos;accès (Pass hebdomadaire et Illimité)
            </h2>
            <p className="mt-2">
              Lorsque tu achètes le Pass hebdomadaire ou l&apos;abonnement
              Illimité, le site dépose dans ton navigateur un cookie nommé{" "}
              <Key>candiview_access</Key>. Il contient un jeton aléatoire qui permet
              à nos serveurs de reconnaître ton achat sur cet appareil et de te
              donner l&apos;accès illimité.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                Il est déposé uniquement après un achat de ce type, jamais lors de
                la simple navigation.
              </li>
              <li>
                Il n&apos;est pas lisible par les scripts de la page (cookie «
                httpOnly »), n&apos;est transmis que sur connexion sécurisée et
                n&apos;est envoyé qu&apos;à CandiView.
              </li>
              <li>
                Durée de vie : 12 mois au maximum. La validité réelle de ton accès
                (7 jours pour le Pass, tant que l&apos;abonnement est actif pour
                Illimité) est vérifiée côté serveur.
              </li>
              <li>
                Il est strictement nécessaire au service que tu as demandé : il ne
                sert ni à te suivre, ni à de la publicité, et ne nécessite donc pas
                de consentement de ta part.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              Durée de conservation
            </h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                <strong>Résultats générés et informations techniques</strong> (base
                de données) :{" "}
                <Mark kind="À COMPLÉTER" label="durée à décider" />
              </li>
              <li>
                <strong>Données d&apos;accès (Pass hebdomadaire / Illimité)</strong>{" "}
                (adresse email, statut, identifiants Stripe) : pendant la durée de
                l&apos;accès, puis{" "}
                <Mark kind="À COMPLÉTER" label="durée de conservation après la fin de l'accès" />
              </li>
              <li>
                <strong>Cookie d&apos;accès :</strong> 12 mois au maximum, ou jusqu&apos;à ce
                que tu le supprimes.
              </li>
              <li>
                <strong>Stockage local du navigateur :</strong> jusqu&apos;à ce que tu
                le supprimes.
              </li>
              <li>
                <strong>Données de paiement :</strong> conservées par Stripe selon
                ses propres règles et les obligations légales applicables.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">Tes droits</h2>
            <p className="mt-2">
              Tu disposes d&apos;un droit d&apos;accès, de rectification,
              d&apos;effacement, d&apos;opposition, de limitation du traitement et de
              portabilité de tes données. Pour les exercer, écris-nous à{" "}
              <MailLink />.
            </p>
            <p className="mt-3">
              Comme il n&apos;existe pas de compte, nous ne pouvons retrouver tes
              données qu&apos;à partir de l&apos;identifiant de génération. Pour
              demander l&apos;effacement, communique-nous cet identifiant : il figure
              dans le stockage local de ton navigateur (clé{" "}
              <Key>entretien-ia:last-generation-id</Key>). Si tu as payé, il peut
              aussi être retrouvé à partir de ton paiement Stripe. Pour les données
              d&apos;accès au Pass hebdomadaire ou à l&apos;abonnement Illimité, nous te
              retrouvons à partir de l&apos;adresse email saisie lors du paiement.
            </p>
            <p className="mt-3">
              Tu peux également introduire une réclamation auprès de la CNIL :{" "}
              <a
                href="https://www.cnil.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-emerald-600 underline hover:text-emerald-700"
              >
                cnil.fr
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              Une recommandation
            </h2>
            <p className="mt-2">
              N&apos;inclus pas de données sensibles dans ton CV ou ta fiche de
              poste (santé, opinions politiques ou religieuses, origine, vie
              sexuelle, etc.) : elles ne sont pas nécessaires pour générer des
              questions d&apos;entretien.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-navy-800">
              Dernière mise à jour
            </h2>
            <p className="mt-2">6 octobre 2026.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
