import { CANONICAL_ORIGIN } from "./site";

/**
 * Base des liens construits cote serveur (retour de Stripe Checkout, portail
 * client, liens des emails). Volontairement une variable d'environnement et
 * jamais l'en-tete Origin/Host de la requete, controlable par l'appelant.
 *
 * - Developpement : SITE_URL (http://localhost:3000), sinon localhost.
 * - Production : toujours le domaine canonique. Si SITE_URL est (par erreur)
 *   regle sur l'apex sans "www", on le remplace par le domaine canonique pour
 *   eviter une redirection supplementaire apres paiement ou depuis un email.
 */
function resolveSiteUrl(): string {
  const configured = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  const isProduction = process.env.NODE_ENV === "production";

  if (!configured) {
    return isProduction ? CANONICAL_ORIGIN : "http://localhost:3000";
  }
  if (isProduction && configured === "https://candiview.fr") {
    return CANONICAL_ORIGIN;
  }
  return configured;
}

export const SITE_URL = resolveSiteUrl();
