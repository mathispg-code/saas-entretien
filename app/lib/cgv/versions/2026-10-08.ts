import type { CgvDocument, Inline } from "../types";

/**
 * CGV, version du 8 octobre 2026 : VERSION FIGEE. Ne jamais modifier ce
 * fichier une fois la version utilisee pour un achat (son empreinte est
 * epinglee dans app/lib/cgv/index.ts et verifiee avant chaque envoi de PDF).
 * Toute evolution des CGV = un nouveau fichier de version.
 *
 * Offres couvertes : Fiche unique et Pass hebdomadaire (paiement unique par
 * carte). L'abonnement Illimite en est volontairement absent (retire de
 * l'offre) : ses clauses figurent dans la version 2026-10-06.
 *
 * Difference avec 2026-10-07 : l'article « Mediation de la consommation » est
 * retire (la CCI a confirme que l'editeur peut s'en passer pour l'instant) ; la
 * version ne contient plus aucun marqueur de brouillon. Pour ajouter un
 * mediateur plus tard : nouvelle version (voir TODO.md).
 */
const b = (text: string): Inline => ({ t: "b", text });
const br: Inline = { t: "br" };
const mail: Inline = { t: "mail" };
const privacyLink: Inline = {
  t: "link",
  href: "/confidentialite",
  text: "politique de confidentialité",
};

export const cgv20261008: CgvDocument = {
  version: "2026-10-08",
  versionLabel: "8 octobre 2026",
  title: "Conditions générales de vente",
  sections: [
    {
      title: "1. Éditeur",
      blocks: [
        {
          t: "p",
          c: [
            "Le site candiview.fr est édité par Mathis Pichon-Girodie, entrepreneur individuel (micro-entrepreneur), sous le nom commercial CandiView.",
            br,
            "SIREN : 109 791 426 — SIRET : 109 791 426 00017",
            br,
            "Immatriculé au RCS de Paris, n° 109 791 426",
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
      title: "2. Objet et champ d'application",
      blocks: [
        {
          t: "p",
          c: [
            "Les présentes conditions générales de vente (CGV) régissent la vente en ligne, par l'éditeur, d'un accès payant à des fonctionnalités de CandiView, outil d'aide à la préparation aux entretiens d'embauche, à des consommateurs, c'est-à-dire des personnes physiques qui agissent à des fins n'entrant pas dans le cadre de leur activité professionnelle (le « client »).",
          ],
        },
        {
          t: "p",
          c: [
            "Elles s'appliquent à toute commande passée sur candiview.fr. Le client déclare avoir la capacité de contracter, avoir pris connaissance des CGV avant de commander et les accepter en cochant la case prévue à cet effet sur la page de paiement.",
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
            "Le Pass hebdomadaire à 6,99 € (paiement unique, sans reconduction) donne un accès illimité pendant 7 jours à compter du paiement : sur chaque fiche de poste générée pendant cette période, le feedback, l'analyse des points faibles du CV, l'export PDF et les options jusqu'à 12 questions sont inclus, dans la limite de l'usage raisonnable décrit à l'article 7. À l'issue des 7 jours, l'accès s'arrête automatiquement ; il n'y a ni reconduction ni nouveau prélèvement.",
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
            "Le pack Fiche unique est vendu 3,99 € et le Pass hebdomadaire 6,99 €. Prix en euros, toutes taxes comprises. TVA non applicable, article 293 B du CGI.",
          ],
        },
        {
          t: "p",
          c: [
            "Les prix applicables sont ceux affichés sur le site au moment de la commande. L'éditeur peut les modifier à tout moment ; les modifications ne s'appliquent pas aux commandes déjà passées. Aucun frais de livraison n'est facturé, le service étant entièrement numérique.",
          ],
        },
      ],
    },
    {
      title: "5. Commande et paiement",
      blocks: [
        {
          t: "p",
          c: [
            "Pour commander, le client choisit une offre, est redirigé vers la page de paiement sécurisée de Stripe, y saisit son adresse email et les données de sa carte bancaire, puis coche la case d'acceptation des CGV et de demande d'exécution immédiate avant de valider le paiement.",
          ],
        },
        {
          t: "p",
          c: [
            "Le paiement s'effectue exclusivement par carte bancaire, par l'intermédiaire de Stripe. L'éditeur ne conserve aucune donnée de carte bancaire. Le contrat est conclu, et la commande devient ferme, à la confirmation du paiement par Stripe.",
          ],
        },
        {
          t: "p",
          c: [
            "Le client reçoit, à l'adresse email saisie lors du paiement, un email de confirmation de commande qui récapitule l'offre, le prix, la date de la commande et l'accord donné, et auquel sont jointes les présentes CGV dans la version en vigueur à la date de la commande. Il est invité à conserver cet email.",
          ],
        },
      ],
    },
    {
      title: "6. Fourniture du service et accès",
      blocks: [
        {
          t: "p",
          c: [
            "Le service est fourni exclusivement par voie numérique, sans livraison physique, immédiatement après la confirmation du paiement. L'éditeur n'est pas responsable d'une impossibilité d'accéder au service due à l'équipement ou à la connexion Internet du client.",
          ],
        },
        {
          t: "p",
          c: [
            "Il n'existe pas de compte utilisateur : l'accès est lié à l'appareil et au navigateur utilisés lors de l'achat (stockage local pour la Fiche unique, cookie d'accès pour le Pass hebdomadaire). Changer d'appareil, vider les données du navigateur ou utiliser la navigation privée peut entraîner la perte de l'accès.",
          ],
        },
        {
          t: "p",
          c: [
            "Pour le Pass hebdomadaire, l'accès est rattaché à l'adresse email saisie lors du paiement et à l'appareil utilisé lors de l'achat, grâce à un cookie strictement nécessaire au service (voir la ",
            privacyLink,
            ").",
          ],
        },
        {
          t: "p",
          c: [
            "En cas de changement d'appareil ou de perte du cookie, l'accès au Pass hebdomadaire peut être retrouvé, tant qu'il est valide, depuis la page « Mon accès » : un lien à usage unique, valable 15 minutes, est envoyé à l'adresse email saisie lors du paiement. L'accès est alors activé sur le nouvel appareil et désactivé sur le précédent (un seul appareil à la fois).",
          ],
        },
      ],
    },
    {
      title: "7. Usage raisonnable",
      blocks: [
        {
          t: "p",
          c: [
            "Le Pass hebdomadaire donne droit à des générations illimitées dans le cadre d'un usage personnel normal, pour préparer ses propres entretiens. Sont notamment considérés comme abusifs : un volume anormalement élevé de générations, l'usage automatisé du service et le partage de l'accès avec des tiers.",
          ],
        },
        {
          t: "p",
          c: [
            "En cas d'usage manifestement abusif, l'éditeur peut limiter temporairement le nombre de générations. En cas d'abus répété, il peut suspendre l'accès après en avoir informé le client par email et l'avoir mis en mesure de présenter ses observations. Ces mesures ne portent pas atteinte aux droits dont le consommateur dispose en vertu de la loi.",
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
            "Conformément à l'article L221-18 du Code de la consommation, le consommateur dispose en principe d'un délai de 14 jours à compter de la conclusion du contrat pour se rétracter d'un achat conclu à distance, sans avoir à motiver sa décision.",
          ],
        },
        {
          t: "p",
          c: [
            "Les offres sont des contenus ou services numériques fournis immédiatement après le paiement. Avant de payer, le client demande expressément l'exécution immédiate du service et renonce expressément à son droit de rétractation, en cochant la case prévue à cet effet sur la page de paiement :",
          ],
        },
        {
          t: "ul",
          items: [
            [
              b("pour la Fiche unique"),
              " (contenu numérique fourni sans support matériel, dont l'exécution commence immédiatement), conformément à l'article L221-28, 13° du Code de la consommation ;",
            ],
            [
              b("pour le Pass hebdomadaire"),
              " (service pleinement exécuté à l'issue des 7 jours d'accès, soit avant la fin du délai de rétractation), conformément à l'article L221-28, 1° du Code de la consommation.",
            ],
          ],
        },
        {
          t: "p",
          c: [
            "Cette case est affichée par Stripe sur la page de paiement sécurisée, avant le paiement, et le paiement n'est possible qu'une fois la case cochée. Son libellé est le suivant : « ",
            { t: "consent", id: "ponctuel-v2" },
            " ».",
          ],
        },
        {
          t: "p",
          c: [
            "Si, pour quelque motif que ce soit, cette renonciation ne pouvait être opposée au client, il pourrait exercer son droit de rétractation dans le délai de 14 jours en notifiant sa décision à l'éditeur par email à ",
            mail,
            ", en indiquant sa référence de commande (un modèle de formulaire de rétractation figure en annexe). Conformément à l'article L221-25 du Code de la consommation, il devrait alors payer à l'éditeur un montant proportionnel au service déjà fourni jusqu'à la communication de sa décision. L'éditeur rembourserait le solde dans un délai de 14 jours à compter de la réception de la demande, par le même moyen de paiement.",
          ],
        },
        {
          t: "p",
          c: [
            "La date et l'heure du paiement, la version des CGV acceptée et le libellé de la case sont conservés comme preuve de l'accord du client.",
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
            "Les questions et les conseils sont générés par intelligence artificielle (API d'Anthropic) à partir des documents fournis par le client, qui reste responsable des informations qu'il y inclut et est invité à n'y faire figurer aucune donnée sensible. Ils sont fournis à titre indicatif et peuvent contenir des inexactitudes. L'éditeur ne garantit aucun résultat en entretien ni l'obtention d'un emploi.",
          ],
        },
      ],
    },
    {
      title: "10. Garantie légale de conformité",
      blocks: [
        {
          t: "p",
          c: [
            "Le consommateur bénéficie de la garantie légale de conformité applicable aux contenus numériques et aux services numériques, prévue par le Code de la consommation, indépendamment de toute garantie commerciale. En cas de défaut de conformité, il peut écrire à ",
            mail,
            " en décrivant le problème ; l'éditeur mettra le contenu ou le service en conformité ou, à défaut, appliquera les remèdes prévus par la loi.",
          ],
        },
      ],
    },
    {
      title: "11. Responsabilité",
      blocks: [
        {
          t: "p",
          c: [
            "La responsabilité de l'éditeur est limitée dans la mesure permise par la loi. Elle ne saurait être engagée pour les conséquences de l'usage des contenus générés, fournis à titre indicatif. L'éditeur ne garantit pas une disponibilité ininterrompue du service et peut l'interrompre pour maintenance.",
          ],
        },
        {
          t: "p",
          c: [
            "Aucune stipulation des présentes CGV n'exclut ni ne limite la responsabilité de l'éditeur en cas de dol, de faute lourde ou de dommage corporel, ni les droits impératifs du consommateur, notamment la garantie légale de conformité.",
          ],
        },
      ],
    },
    {
      title: "12. Propriété intellectuelle",
      blocks: [
        {
          t: "p",
          c: [
            "Les contenus générés peuvent être utilisés par le client pour sa préparation personnelle. Le site, la marque CandiView, les textes, le code et les éléments graphiques restent la propriété de l'éditeur ; toute reproduction ou exploitation non autorisée est interdite.",
          ],
        },
      ],
    },
    {
      title: "13. Données personnelles",
      blocks: [
        {
          t: "p",
          c: [
            "Le traitement des données personnelles (adresse email, données de paiement traitées par Stripe, données d'accès, preuve de l'accord du client) est détaillé dans notre ",
            privacyLink,
            ". Le client peut exercer ses droits en écrivant à ",
            mail,
            ".",
          ],
        },
      ],
    },
    {
      title: "14. Preuve et version des CGV",
      blocks: [
        {
          t: "p",
          c: [
            "Les données conservées par l'éditeur (date et heure du paiement, version des CGV acceptée, libellé de la case, email de confirmation envoyé) valent preuve de la commande et de l'accord du client, sauf preuve contraire.",
          ],
        },
        {
          t: "p",
          c: [
            "Les CGV applicables à une commande sont celles en vigueur à la date de cette commande : elles sont jointes à l'email de confirmation. L'éditeur peut modifier les CGV pour l'avenir ; les nouvelles versions ne s'appliquent pas aux commandes déjà passées.",
          ],
        },
      ],
    },
    {
      title: "15. Service client et réclamations",
      blocks: [
        {
          t: "p",
          c: [
            "Pour toute question ou réclamation, le client peut écrire à ",
            mail,
            " en indiquant sa référence de commande. L'éditeur s'efforce de répondre dans les meilleurs délais.",
          ],
        },
      ],
    },
    {
      title: "16. Droit applicable et litiges",
      blocks: [
        {
          t: "p",
          c: ["Les présentes CGV sont rédigées en français et soumises au droit français."],
        },
        {
          t: "p",
          c: [
            "À défaut de résolution amiable, le consommateur peut saisir, à son choix, l'une des juridictions territorialement compétentes en vertu du Code de procédure civile ou la juridiction du lieu où il demeurait au moment de la conclusion du contrat ou de la survenance du fait dommageable.",
          ],
        },
        {
          t: "p",
          c: [
            "Si une stipulation des présentes CGV était déclarée nulle ou inapplicable, les autres stipulations resteraient en vigueur.",
          ],
        },
      ],
    },
    {
      title: "17. Entrée en vigueur",
      blocks: [
        {
          t: "p",
          c: ["Version du 8 octobre 2026, applicable aux commandes passées à compter de cette date."],
        },
      ],
    },
    {
      title: "Annexe : modèle de formulaire de rétractation",
      blocks: [
        {
          t: "p",
          c: [
            "(Veuillez compléter et renvoyer le présent formulaire uniquement si vous souhaitez vous rétracter du contrat.)",
          ],
        },
        {
          t: "p",
          c: [
            "À l'attention de Mathis Pichon-Girodie (CandiView), 173 rue de Courcelles, 75017 Paris, ",
            mail,
            " :",
            br,
            "Je/Nous (*) vous notifie/notifions (*) par la présente ma/notre (*) rétractation du contrat portant sur la vente du bien (*)/pour la prestation de services (*) ci-dessous :",
            br,
            "Commandé le (*)/reçu le (*) :",
            br,
            "Nom du (des) consommateur(s) :",
            br,
            "Adresse du (des) consommateur(s) :",
            br,
            "Signature du (des) consommateur(s) (uniquement en cas de notification du présent formulaire sur papier) :",
            br,
            "Date :",
            br,
            "(*) Rayez la mention inutile.",
          ],
        },
      ],
    },
  ],
};
