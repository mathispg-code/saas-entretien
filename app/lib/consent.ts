/**
 * Consentement avant paiement : une case unique, affichee par Stripe Checkout
 * sur la page de paiement (consent_collection + custom_text). Cette case
 * porte l'acceptation des CGV, la demande d'execution immediate et la
 * renonciation / information sur le droit de retractation.
 *
 * Source unique des textes : ils sont envoyes a Stripe, repris dans les CGV et
 * enregistres dans la table "consents" par le webhook. Un texte modifie recoit
 * un NOUVEL identifiant (jamais reutilise) pour que la preuve de ce qui a ete
 * affiche reste exacte. Les formulations sont a faire valider par un juriste
 * (voir TODO.md).
 */
export type CheckoutPlanId = "unique" | "hebdo" | "mensuel";

// La version des CGV en vigueur (CGV_VERSION) est definie par le registre
// des versions figees : voir app/lib/cgv/index.ts.

export const CONSENT_TEXT_IDS = ["ponctuel-v1", "abonnement-v1"] as const;
export type ConsentTextId = (typeof CONSENT_TEXT_IDS)[number];

// {cgv} est remplace par un lien Markdown vers les CGV (Stripe) ou par le mot
// "CGV" seul (texte brut, CGV du site).
const CONSENT_TEMPLATES: Record<ConsentTextId, string> = {
  // Fiche unique et Pass hebdomadaire : paiement unique.
  "ponctuel-v1":
    "J'accepte les {cgv} et je demande l'accès immédiat : je renonce à mon droit de rétractation.",
  // Illimité : abonnement mensuel.
  "abonnement-v1":
    "J'accepte les {cgv} et je demande l'accès immédiat. Si je me rétracte sous 14 jours, je paie le service déjà utilisé.",
};

export function consentTextIdForPlan(plan: CheckoutPlanId): ConsentTextId {
  return plan === "mensuel" ? "abonnement-v1" : "ponctuel-v1";
}

export function isConsentTextId(value: unknown): value is ConsentTextId {
  return typeof value === "string" && (CONSENT_TEXT_IDS as readonly string[]).includes(value);
}

/** Texte pour Stripe (custom_text, limite de 1 200 caracteres), avec lien Markdown. */
export function consentMessageForStripe(id: ConsentTextId, cgvUrl: string): string {
  return CONSENT_TEMPLATES[id].replace("{cgv}", `[CGV](${cgvUrl})`);
}

/** Texte brut (sans lien), pour les CGV du site. */
export function consentPlainText(id: ConsentTextId): string {
  return CONSENT_TEMPLATES[id].replace("{cgv}", "CGV");
}
