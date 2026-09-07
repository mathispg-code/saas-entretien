import Stripe from "stripe";

/**
 * Client Stripe cote serveur uniquement (cle secrete, jamais exposee au
 * navigateur). A n'importer que depuis des route handlers.
 */
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
