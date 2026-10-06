import { GENERIC_ERROR_MESSAGE, json, optionsResponse } from "../../lib/api-response";
import { getAccessFromRequest } from "../../lib/access-session";
import { SITE_URL } from "../../lib/site-url";
import { stripe } from "../../lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

// "Gerer mon abonnement" : ouvre le Customer Portal Stripe (resiliation,
// carte bancaire, factures) pour l'abonne identifie par son cookie d'acces.
export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  if (!stripe) {
    console.error("Stripe non configuré (STRIPE_SECRET_KEY manquante).");
    return json({ error: GENERIC_ERROR_MESSAGE }, 500, origin);
  }

  try {
    const access = await getAccessFromRequest(request);
    if (!access || access.plan !== "mensuel" || !access.stripe_customer_id) {
      return json({ error: "Aucun abonnement à gérer sur cet appareil." }, 404, origin);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: access.stripe_customer_id,
      return_url: `${SITE_URL}/generateur`,
    });
    return json({ url: session.url }, 200, origin);
  } catch (error) {
    console.error("Erreur lors de la création de la session du portail Stripe:", error);
    return json({ error: GENERIC_ERROR_MESSAGE }, 500, origin);
  }
}
