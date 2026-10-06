import type { OutgoingEmail } from "./email";

/**
 * Email de confirmation du contrat, envoye apres chaque paiement abouti
 * (support durable : le recapitulatif, le rappel du consentement et les CGV de
 * la version de l'achat en PDF joint). Fonction pure : memes donnees = meme
 * email, ce qui garantit qu'un envoi rejoue (cle d'idempotence Resend) a le
 * meme contenu. Vouvoiement. Les passages juridiques encore a valider portent
 * des marqueurs [À COMPLÉTER : ...] / [À FAIRE VALIDER : ...] (voir TODO.md).
 */
export const CONTRACT_EMAIL_TEMPLATE_ID = "confirmation-contrat-v1";

export type ContractPlan = "unique" | "hebdo" | "mensuel";

export type ContractEmailInput = {
  to: string;
  plan: ContractPlan;
  reference: string;
  paidAt: Date;
  amountCents: number | null;
  currency: string | null;
  consentText: string;
  consentedAt: Date;
  cgvVersionLabel: string;
  accessEndsAt: Date | null;
  renewsAt: Date | null;
  siteUrl: string;
};

const EDITOR_LINES = [
  "Mathis Pichon-Girodie, entrepreneur individuel (micro-entrepreneur), nom commercial CandiView",
  "SIREN : 109 791 426 — RCS Paris",
  "173 rue de Courcelles, 75017 Paris",
  "contact@candiview.fr",
];

const PLAN_LABELS: Record<ContractPlan, string> = {
  unique: "Fiche unique",
  hebdo: "Pass hebdomadaire",
  mensuel: "Illimité (abonnement mensuel)",
};

const DEFAULT_PRICE_CENTS: Record<ContractPlan, number> = { unique: 399, hebdo: 699, mensuel: 999 };

// Presence d'un marqueur de brouillon : en mode reel (livemode), l'email n'est
// jamais envoye tant qu'il en contient (voir contract-confirmation.ts).
const DRAFT_MARKER = /\[À (?:COMPLÉTER|FAIRE VALIDER) :/;
export function containsDraftMarkers(text: string): boolean {
  return DRAFT_MARKER.test(text);
}

const dateTime = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});
const dateOnly = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" });

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: currency.toUpperCase() }).format(
    cents / 100,
  );
}

type Section = { heading: string; paragraphs: string[]; bullets?: string[] };

function buildSections(input: ContractEmailInput): { intro: string; sections: Section[]; closing: string } {
  const price = formatPrice(
    input.amountCents ?? DEFAULT_PRICE_CENTS[input.plan],
    input.currency ?? "eur",
  );

  const offer: string[] = [];
  if (input.plan === "unique") {
    offer.push(
      "Le pack Fiche unique s'applique à une fiche de poste : feedback sur chaque question, analyse des points faibles du CV, export PDF et options à 8 et 12 questions. S'il a été acheté avant toute génération, il s'applique à votre prochaine génération ; une nouvelle fiche de poste nécessite un nouveau pack.",
    );
  } else if (input.plan === "hebdo") {
    offer.push(
      `Le Pass hebdomadaire donne un accès illimité (dans la limite de l'usage raisonnable décrit dans les conditions générales de vente) à toutes les fonctionnalités pendant 7 jours à compter du paiement${
        input.accessEndsAt ? `, soit jusqu'au ${dateTime.format(input.accessEndsAt)} (heure de Paris)` : ""
      }. Il s'arrête automatiquement, sans reconduction ni nouveau prélèvement.`,
    );
  } else {
    offer.push(
      "L'abonnement Illimité donne un accès illimité (dans la limite de l'usage raisonnable décrit dans les conditions générales de vente) à toutes les fonctionnalités. Il est conclu pour un mois et renouvelé tacitement chaque mois jusqu'à sa résiliation.",
    );
    if (input.renewsAt) {
      offer.push(`Prochain renouvellement : le ${dateOnly.format(input.renewsAt)}.`);
    }
    offer.push(
      `Vous pouvez le résilier à tout moment, en ligne, en un clic, sur ${input.siteUrl}/mon-acces (bouton « Gérer mon abonnement »), sans nous contacter. La résiliation prend effet à la fin de la période mensuelle en cours, déjà payée : vous conservez l'accès jusqu'à cette date et aucun nouveau prélèvement n'a lieu ensuite.`,
    );
  }

  const withdrawal: string[] =
    input.plan === "mensuel"
      ? [
          "Vous disposez en principe d'un délai de 14 jours à compter de la conclusion du contrat pour vous rétracter (article L221-18 du Code de la consommation). Vous avez demandé l'accès immédiat au service : si vous vous rétractez dans ce délai, vous paierez le service déjà utilisé.",
          "Pour vous rétracter, écrivez à contact@candiview.fr en indiquant votre référence de commande.",
          "[À FAIRE VALIDER : mécanisme de paiement proportionnel et formulation pour l'abonnement mensuel]",
        ]
      : [
          "Conformément à votre demande d'accès immédiat au service, vous avez reconnu perdre votre droit de rétractation une fois le service exécuté (articles L221-18 et L221-28 du Code de la consommation).",
          "[À FAIRE VALIDER : formulation de la renonciation pour un service numérique fourni immédiatement]",
        ];
  withdrawal.push(
    "[À COMPLÉTER : modèle de formulaire de rétractation (annexe de l'article R221-1 du Code de la consommation), si requis pour cette offre]",
  );

  const access =
    input.plan === "unique"
      ? "Votre pack est lié à l'appareil et au navigateur utilisés lors de l'achat (stockage local). Changer d'appareil, vider les données du navigateur ou utiliser la navigation privée peut entraîner la perte de l'accès."
      : `Votre accès est rattaché à l'adresse email saisie lors du paiement et à l'appareil utilisé lors de l'achat. Si vous changez d'appareil, vous pouvez le retrouver sur ${input.siteUrl}/mon-acces : un lien à usage unique, valable 15 minutes, est alors envoyé à cette adresse.`;

  return {
    intro: `Nous confirmons votre commande passée le ${dateTime.format(input.paidAt)} (heure de Paris) sur candiview.fr.`,
    sections: [
      {
        heading: "Votre commande",
        paragraphs: [],
        bullets: [
          `Référence : ${input.reference}`,
          `Offre : ${PLAN_LABELS[input.plan]}`,
          `Prix : ${price} TTC — TVA non applicable, article 293 B du CGI`,
          "Paiement : par carte bancaire, via Stripe (nous ne conservons aucune donnée de carte)",
        ],
      },
      { heading: "Ce que comprend votre offre", paragraphs: offer },
      {
        heading: "Votre accord avant le paiement",
        paragraphs: [
          `Sur la page de paiement, vous avez coché la case suivante : « ${input.consentText} »`,
          `Cet accord a été enregistré le ${dateTime.format(input.consentedAt)} (heure de Paris), au plus tard à l'heure du paiement. Version des conditions générales de vente acceptée : ${input.cgvVersionLabel}.`,
        ],
      },
      { heading: "Droit de rétractation", paragraphs: withdrawal },
      { heading: "Votre accès", paragraphs: [access] },
      {
        heading: "Conditions générales de vente",
        paragraphs: [
          `Les conditions générales de vente (version du ${input.cgvVersionLabel}), en vigueur à la date de votre commande, sont jointes à cet email au format PDF. Conservez ce message.`,
        ],
      },
      {
        heading: "Médiation de la consommation",
        paragraphs: [
          "[À COMPLÉTER : coordonnées du médiateur de la consommation (nom, site web, adresse postale)]",
        ],
      },
      { heading: "Éditeur", paragraphs: [], bullets: EDITOR_LINES },
    ],
    closing: "Cordialement,\nCandiView",
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Surligne les marqueurs de brouillon dans la version HTML.
function htmlWithMarkers(value: string): string {
  return escapeHtml(value).replace(
    /\[(À (?:COMPLÉTER|FAIRE VALIDER) : [^\]]*)\]/g,
    '<mark style="background:#fef3c7;color:#92400e;font-weight:bold;padding:0 3px;border-radius:3px">[$1]</mark>',
  );
}

export function buildContractEmail(input: ContractEmailInput): OutgoingEmail & { templateId: string } {
  const { intro, sections, closing } = buildSections(input);

  const textParts: string[] = ["Bonjour,", "", intro, ""];
  for (const section of sections) {
    textParts.push(section.heading.toUpperCase());
    for (const paragraph of section.paragraphs) textParts.push(paragraph, "");
    if (section.bullets) {
      for (const bullet of section.bullets) textParts.push(`- ${bullet}`);
      textParts.push("");
    } else if (section.paragraphs.length === 0) {
      textParts.push("");
    }
  }
  textParts.push(closing);
  const text = textParts.join("\n");

  const htmlSections = sections
    .map((section) => {
      const paragraphs = section.paragraphs
        .map((p) => `<p style="margin:6px 0;font-size:14px;color:#334155">${htmlWithMarkers(p)}</p>`)
        .join("");
      const bullets = section.bullets
        ? `<ul style="margin:6px 0;padding-left:20px;font-size:14px;color:#334155">${section.bullets
            .map((b) => `<li>${htmlWithMarkers(b)}</li>`)
            .join("")}</ul>`
        : "";
      return `<h2 style="margin:22px 0 4px;font-size:15px;color:#0f172a">${escapeHtml(section.heading)}</h2>${paragraphs}${bullets}`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="fr"><body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px">
<p style="margin:0 0 4px;font-size:18px;font-weight:bold">Candi<span style="color:#10b981">View</span></p>
<p style="margin:16px 0 0;font-size:14px;color:#334155">Bonjour,</p>
<p style="margin:6px 0;font-size:14px;color:#334155">${escapeHtml(intro)}</p>
${htmlSections}
<p style="margin:24px 0 0;font-size:14px;color:#334155">${escapeHtml(closing).replace(/\n/g, "<br>")}</p>
</div></body></html>`;

  return {
    to: input.to,
    subject: `Confirmation de votre commande CandiView (${PLAN_LABELS[input.plan]}) — réf. ${input.reference}`,
    text,
    html,
    templateId: CONTRACT_EMAIL_TEMPLATE_ID,
  };
}
