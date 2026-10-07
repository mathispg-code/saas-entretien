import Stripe from "stripe";

/**
 * Client Stripe cote serveur uniquement (cle secrete, jamais exposee au
 * navigateur). A n'importer que depuis des route handlers.
 */
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

/** Vrai avec une cle Stripe de production (sk_live_ ou rk_live_) : paiements reels. */
export const STRIPE_LIVE_MODE = /^(sk|rk)_live_/.test(stripeSecretKey ?? "");

/** Offres vendues via Stripe Checkout. */
export type CheckoutPlan = "unique" | "hebdo" | "mensuel";

export function isCheckoutPlan(value: unknown): value is CheckoutPlan {
  return value === "unique" || value === "hebdo" || value === "mensuel";
}

/**
 * Un price Stripe par offre, via des variables distinctes pour pouvoir
 * basculer test/live sans toucher au code. STRIPE_PRICE_ID reste accepte en
 * repli pour la Fiche unique (ancien nom de la variable).
 */
export const STRIPE_PRICE_IDS: Record<CheckoutPlan, string | undefined> = {
  unique: process.env.STRIPE_PRICE_ID_UNIQUE ?? process.env.STRIPE_PRICE_ID,
  hebdo: process.env.STRIPE_PRICE_ID_HEBDO,
  mensuel: process.env.STRIPE_PRICE_ID_MENSUEL,
};
