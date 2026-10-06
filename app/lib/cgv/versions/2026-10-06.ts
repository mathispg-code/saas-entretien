import type { CgvDocument, Inline } from "../types";

/**
 * CGV, version du 6 octobre 2026 : VERSION FIGEE. Ne jamais modifier ce
 * fichier une fois la version utilisee pour un achat (son empreinte est
 * epinglee dans app/lib/cgv/index.ts et verifiee avant chaque envoi de PDF).
 * Toute evolution des CGV = un nouveau fichier de version.
 */
const b = (text: string): Inline => ({ t: "b", text });
const mark = (kind: "À COMPLÉTER" | "À FAIRE VALIDER", label: string): Inline => ({
  t: "mark",
  kind,
  label,
});
const br: Inline = { t: "br" };
const mail: Inline = { t: "mail" };
const privacyLink: Inline = {
  t: "link",
  href: "/confidentialite",
  text: "politique de confidentialité",
};

export const cgv20261006: CgvDocument = {
  version: "2026-10-06",
  versionLabel: "6 octobre 2026",
  title: "Conditions générales de vente",
  notice: [
    mark(
      "À FAIRE VALIDER",
      "version brouillon incluant le Pass hebdomadaire et l'abonnement Illimité, à relire par un juriste avant ouverture au public",
    ),
  ],
  sections: [
    {
      title: "1. Éditeur",
      blocks: [
        {
          t: "p",
          c: [
            "Le site candiview.fr est édité par Mathis Pichon-Girodie, entrepreneur individuel (micro-entrepreneur), sous le nom commercial CandiView.",
            br,
            "SIREN : 109 791 426 — RCS Paris",
            br,
            "Adresse : 173 rue de Courcelles, 75017 Paris",
            br,
            "Email : ",
            mail,
            br,
            "TVA non applicable, article 293 B du CGI.",
          ],
        },
      ],
    },
    {
      title: "2. Objet",
      blocks: [
        {
          t: "p",
          c: [
            "Les présentes conditions générales de vente (CGV) régissent la vente en ligne d'un accès payant à des fonctionnalités de CandiView, outil d'aide à la préparation aux entretiens d'embauche.",
          ],
        },
      ],
    },
    {
      title: "3. Offres",
      blocks: [
        {
          t: "p",
          c: [
            "La première génération de 5 questions, ainsi que les questions à poser au recruteur, sont gratuites et sans compte.",
          ],
        },
        { t: "h3", text: "3.1 Fiche unique" },
        {
          t: "p",
          c: [
            "Le pack Fiche unique à 3,99 € (paiement unique, par fiche de poste / génération) débloque :",
          ],
        },
        {
          t: "ul",
          items: [
            ["le feedback sur chaque question ;"],
            ["l'analyse des points faibles du CV ;"],
            ["l'export PDF ;"],
            ["les options à 8 et 12 questions."],
          ],
        },
        {
          t: "p",
          c: [
            "Le pack s'applique uniquement à la génération pour laquelle il est acheté. S'il est acheté avant toute génération, il s'applique à la prochaine génération réalisée. Une nouvelle fiche de poste nécessite un nouveau pack.",
          ],
        },
        { t: "h3", text: "3.2 Pass hebdomadaire" },
        {
          t: "p",
          c: [
            "Le Pass hebdomadaire à 6,99 € (paiement unique, sans reconduction) donne un accès illimité pendant 7 jours à compter du paiement : sur chaque fiche de poste générée pendant cette période, le feedback, l'analyse des points faibles du CV, l'export PDF et les options jusqu'à 12 questions sont inclus, dans la limite de l'usage raisonnable décrit à l'article 6. À l'issue des 7 jours, l'accès s'arrête automatiquement ; il n'y a aucun nouveau prélèvement.",
          ],
        },
        { t: "h3", text: "3.3 Illimité (abonnement)" },
        {
          t: "p",
          c: [
            "L'offre Illimité à 9,99 € par mois est un abonnement mensuel qui donne un accès illimité aux mêmes fonctionnalités, pour toutes les fiches de poste, dans la limite de l'usage raisonnable décrit à l'article 6. Il se renouvelle chaque mois jusqu'à sa résiliation (article 5).",
          ],
        },
      ],
    },
    {
      title: "4. Prix et TVA",
      blocks: [
        {
          t: "p",
          c: [
            "Le pack Fiche unique est vendu 3,99 €, le Pass hebdomadaire 6,99 € et l'abonnement Illimité 9,99 € par mois. Prix en euros, toutes taxes comprises. TVA non applicable, article 293 B du CGI.",
          ],
        },
        {
          t: "p",
          c: [
            "Paiement : il est réalisé en ligne, de manière sécurisée, par l'intermédiaire de Stripe. L'éditeur ne conserve aucune donnée de carte bancaire. Pour l'abonnement, le prélèvement est renouvelé automatiquement chaque mois sur le moyen de paiement enregistré auprès de Stripe.",
          ],
        },
      ],
    },
    {
      title: "5. Durée, renouvellement et résiliation",
      blocks: [
        {
          t: "p",
          c: [
            b("Pack Fiche unique et Pass hebdomadaire"),
            " : paiement unique, sans reconduction. Le Pass hebdomadaire prend fin automatiquement 7 jours après le paiement.",
          ],
        },
        {
          t: "p",
          c: [
            b("Abonnement Illimité"),
            " : conclu pour une durée d'un mois, il est renouvelé tacitement chaque mois jusqu'à résiliation. L'abonné peut le résilier à tout moment, en ligne, en un clic, depuis le lien « Gérer mon abonnement » de la page du générateur (portail de gestion sécurisé de Stripe), sans avoir à contacter l'éditeur. La résiliation prend effet à la fin de la période mensuelle en cours, déjà payée : l'accès est conservé jusqu'à cette date et aucun nouveau prélèvement n'a lieu ensuite.",
          ],
        },
        {
          t: "p",
          c: [
            b("Échec de paiement"),
            " : si un prélèvement mensuel échoue, l'accès est conservé pendant que Stripe retente automatiquement le paiement. Si le paiement n'aboutit pas, l'abonnement est résilié et l'accès est coupé. L'abonné peut à tout moment mettre à jour sa carte bancaire via « Gérer mon abonnement ».",
          ],
        },
        {
          t: "p",
          c: [
            mark(
              "À COMPLÉTER",
              "règle de remboursement éventuel d'un mois entamé, et information du consommateur avant chaque reconduction tacite",
            ),
            " ",
            mark(
              "À FAIRE VALIDER",
              "obligations légales applicables à la reconduction tacite et à la résiliation en ligne",
            ),
          ],
        },
      ],
    },
    {
      title: "6. Usage raisonnable",
      blocks: [
        {
          t: "p",
          c: [
            "Les offres Pass hebdomadaire et Illimité donnent droit à des générations illimitées dans le cadre d'un usage personnel normal, pour préparer ses propres entretiens. En cas d'usage manifestement abusif (volume anormalement élevé de générations, usage automatisé, partage de l'accès avec des tiers...), l'éditeur peut limiter temporairement le nombre de générations, sans que cette limitation constitue un manquement de sa part.",
          ],
        },
        {
          t: "p",
          c: [
            mark(
              "À COMPLÉTER",
              "conséquences d'un abus répété (suspension, résiliation) et éventuel seuil indicatif à communiquer",
            ),
          ],
        },
      ],
    },
    {
      title: "7. Accès au service",
      blocks: [
        {
          t: "p",
          c: [
            "Le service numérique est fourni immédiatement après le paiement. Il n'existe pas de compte utilisateur : l'accès est lié à l'appareil et au navigateur utilisés lors de l'achat (stockage local). Changer d'appareil, vider les données du navigateur ou utiliser la navigation privée peut entraîner la perte de l'accès.",
          ],
        },
        {
          t: "p",
          c: [
            "Pour le Pass hebdomadaire et l'abonnement Illimité, l'accès est rattaché à l'adresse email saisie lors du paiement et à l'appareil utilisé lors de l'achat, grâce à un cookie strictement nécessaire au service (voir la ",
            privacyLink,
            ").",
          ],
        },
        {
          t: "p",
          c: [
            "En cas de changement d'appareil ou de perte du cookie, l'accès peut être retrouvé depuis la page « Mon accès » : un lien à usage unique, valable 15 minutes, est envoyé à l'adresse email saisie lors du paiement. L'accès est alors activé sur le nouvel appareil et désactivé sur le précédent (un seul appareil à la fois).",
          ],
        },
      ],
    },
    {
      title: "8. Droit de rétractation",
      blocks: [
        {
          t: "p",
          c: [
            "Conformément à l'article L221-18 du Code de la consommation, le consommateur dispose en principe d'un délai de 14 jours pour se rétracter d'un achat conclu à distance.",
          ],
        },
        {
          t: "p",
          c: [
            "Le pack est un service numérique fourni immédiatement après le paiement. Avant de payer, le consommateur coche la case prévue à cet effet : il demande ainsi expressément l'exécution immédiate du service et reconnaît qu'il perdra son droit de rétractation une fois le service pleinement exécuté, conformément à l'article L221-28 du Code de la consommation. Il renonce en conséquence à son droit de rétractation dans ces conditions.",
          ],
        },
        {
          t: "p",
          c: [
            "Cette case est affichée par Stripe sur la page de paiement sécurisée, avant le paiement, et le paiement n'est possible qu'une fois la case cochée. Elle porte l'un des libellés suivants selon l'offre :",
          ],
        },
        {
          t: "ul",
          items: [
            [
              b("Fiche unique et Pass hebdomadaire"),
              " : « ",
              { t: "consent", id: "ponctuel-v1" },
              " »",
            ],
            [
              b("Abonnement Illimité"),
              " : « ",
              { t: "consent", id: "abonnement-v1" },
              " »",
            ],
          ],
        },
        {
          t: "p",
          c: [
            "La date et l'heure du paiement, la version des CGV acceptée et le libellé affiché sont conservés comme preuve du consentement.",
          ],
        },
        {
          t: "p",
          c: [
            mark(
              "À FAIRE VALIDER",
              "pour le Pass hebdomadaire et surtout pour l'abonnement mensuel, la perte du droit de rétractation et le sort d'un éventuel remboursement partiel dans les 14 jours dépendent de l'exécution du service : le libellé exact de la case et de cette clause doit être validé par un juriste",
            ),
          ],
        },
      ],
    },
    {
      title: "9. Nature du service",
      blocks: [
        {
          t: "p",
          c: [
            "Les questions et les conseils sont générés par intelligence artificielle (API d'Anthropic). Ils sont fournis à titre indicatif et peuvent contenir des inexactitudes. L'éditeur ne garantit aucun résultat en entretien ni l'obtention d'un emploi.",
          ],
        },
      ],
    },
    {
      title: "10. Responsabilité",
      blocks: [
        {
          t: "p",
          c: [
            "La responsabilité de l'éditeur est limitée dans la mesure permise par la loi. Cette limitation n'exclut pas les droits impératifs du consommateur, notamment la garantie légale de conformité.",
          ],
        },
      ],
    },
    {
      title: "11. Propriété intellectuelle",
      blocks: [
        {
          t: "p",
          c: [
            "Les contenus générés peuvent être utilisés par l'utilisateur pour sa préparation personnelle. Le site, la marque CandiView et le code restent la propriété de l'éditeur.",
          ],
        },
      ],
    },
    {
      title: "12. Données personnelles",
      blocks: [
        {
          t: "p",
          c: ["Le traitement des données personnelles est détaillé dans notre ", privacyLink, "."],
        },
      ],
    },
    {
      title: "13. Service client",
      blocks: [{ t: "p", c: ["Pour toute question ou réclamation : ", mail, "."] }],
    },
    {
      title: "14. Loi applicable et rétractation",
      blocks: [
        {
          t: "p",
          c: [
            "Conformément à l'article L221-28, 13° du Code de la consommation, le droit de rétractation ne peut être exercé pour les contenus numériques fournis sans support matériel dont l'exécution a commencé après accord préalable exprès du consommateur et renoncement exprès à son droit de rétractation.",
          ],
        },
        {
          t: "p",
          c: [
            "Les présentes CGV sont soumises au droit français. En cas de litige, les tribunaux compétents sont déterminés selon les règles légales applicables.",
          ],
        },
      ],
    },
    {
      title: "15. Dernière mise à jour",
      blocks: [
        {
          t: "p",
          c: [
            "6 octobre 2026.",
            " ",
            mark("À COMPLÉTER", "date de mise en vigueur de cette version"),
          ],
        },
      ],
    },
  ],
};
