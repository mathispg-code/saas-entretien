/**
 * Offres ouvertes a la vente (module sans dependance : utilisable cote serveur
 * comme dans les composants client).
 *
 * L'abonnement Illimite est RETIRE de l'offre pour l'instant : il n'est ni
 * affiche (/tarifs, modale, bloc du generateur) ni vendable (/api/checkout le
 * refuse). Sa logique reste entierement en place (Checkout en mode abonnement,
 * webhook, portail client, email, accès) pour pouvoir le remettre en vente.
 *
 * Pour le reactiver :
 * 1. passer "mensuel" a true ci-dessous ;
 * 2. publier une nouvelle version des CGV qui reprend les clauses d'abonnement
 *    (renouvellement tacite, resiliation en ligne, echec de paiement,
 *    retractation d'un abonnement) : voir la version figee 2026-10-06 ;
 * 3. revalider la case de consentement de l'abonnement ("abonnement-v1" dans
 *    app/lib/consent.ts) et le courrier de confirmation avec un juriste.
 */
export const OFFERS_ENABLED = {
  unique: true,
  hebdo: true,
  mensuel: false,
} as const;

export type OfferId = keyof typeof OFFERS_ENABLED;

export function isOfferEnabled(offer: OfferId): boolean {
  return OFFERS_ENABLED[offer];
}
