import { GENERIC_ERROR_MESSAGE, json, optionsResponse } from "../../lib/api-response";
import { getActiveAccess } from "../../lib/access-session";
import { getGeneration } from "../../lib/supabase";
import { SITE_URL } from "../../lib/site-url";
import { isCheckoutPlan, STRIPE_PRICE_IDS, stripe } from "../../lib/stripe";

export const runtime = "nodejs";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Les redirections apres paiement partent de SITE_URL (voir app/lib/site-url.ts)
// et jamais de l'en-tete Origin de la requete, controlable par l'appelant : il
// permettrait sinon de faire creer une session Stripe avec une redirection de
// succes arbitraire.

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  let body: { plan?: unknown; generationId?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Corps de requête invalide." }, 400, origin);
  }

  // Sans "plan", comportement historique : pack "Fiche unique" d'une generation.
  const plan = body.plan ?? "unique";
  if (!isCheckoutPlan(plan)) {
    return json({ error: "Offre inconnue." }, 400, origin);
  }

  const priceId = STRIPE_PRICE_IDS[plan];
  if (!stripe || !priceId) {
    console.error(`Stripe non configuré (STRIPE_SECRET_KEY / price de l'offre "${plan}" manquants).`);
    return json({ error: GENERIC_ERROR_MESSAGE }, 500, origin);
  }

  if (plan !== "unique") {
    return createAccessCheckout(request, plan, priceId, origin);
  }

  const { generationId } = body;
  if (!generationId || !UUID_REGEX.test(generationId)) {
    return json({ error: "Identifiant de génération invalide." }, 400, origin);
  }

  let generation;
  try {
    generation = await getGeneration(generationId);
  } catch (error) {
    console.error("Erreur lors de la lecture de la génération avant paiement:", error);
    return json({ error: GENERIC_ERROR_MESSAGE }, 500, origin);
  }

  if (!generation) {
    return json({ error: "Génération introuvable." }, 404, origin);
  }

  if (generation.paid) {
    return json({ error: "Cette génération est déjà débloquée." }, 409, origin);
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { generationId },
      success_url: `${SITE_URL}/generateur?checkout=success`,
      cancel_url: `${SITE_URL}/generateur?checkout=cancelled`,
    });

    if (!session.url) {
      console.error("Session Stripe créée sans URL de redirection.");
      return json({ error: GENERIC_ERROR_MESSAGE }, 500, origin);
    }

    return json({ url: session.url }, 200, origin);
  } catch (error) {
    console.error("Erreur lors de la création de la session Stripe:", error);
    return json({ error: GENERIC_ERROR_MESSAGE }, 500, origin);
  }
}

/**
 * Pass hebdo (paiement unique) et Illimite (abonnement mensuel) : l'acces est
 * rattache a l'acheteur (email saisi dans Checkout) et a son appareil, pas a
 * une generation. Au retour, le navigateur reclame son cookie d'acces avec
 * l'identifiant de session (voir /api/access/claim).
 */
async function createAccessCheckout(
  request: Request,
  plan: "hebdo" | "mensuel",
  priceId: string,
  origin: string | null,
) {
  try {
    if (await getActiveAccess(request)) {
      return json({ error: "Tu as déjà un accès actif." }, 409, origin);
    }
  } catch (error) {
    console.error("Erreur lors de la vérification de l'accès avant paiement:", error);
    return json({ error: GENERIC_ERROR_MESSAGE }, 500, origin);
  }

  try {
    const session = await stripe!.checkout.sessions.create({
      // Pass hebdo : paiement UNIQUE (jamais reconduit). Illimite : vrai
      // abonnement, redebite chaque mois jusqu'a resiliation.
      mode: plan === "hebdo" ? "payment" : "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { plan },
      ...(plan === "hebdo"
        ? { customer_creation: "always" as const }
        : { subscription_data: { metadata: { plan } } }),
      // {CHECKOUT_SESSION_ID} est remplace par Stripe : ne pas l'encoder.
      success_url: `${SITE_URL}/generateur?checkout=success&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/tarifs?checkout=cancelled`,
    });

    if (!session.url) {
      console.error("Session Stripe créée sans URL de redirection.");
      return json({ error: GENERIC_ERROR_MESSAGE }, 500, origin);
    }

    return json({ url: session.url }, 200, origin);
  } catch (error) {
    console.error("Erreur lors de la création de la session Stripe:", error);
    return json({ error: GENERIC_ERROR_MESSAGE }, 500, origin);
  }
}
