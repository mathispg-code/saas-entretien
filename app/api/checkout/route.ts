import { GENERIC_ERROR_MESSAGE, json, optionsResponse } from "../../lib/api-response";
import { getGeneration } from "../../lib/supabase";
import { stripe } from "../../lib/stripe";

export const runtime = "nodejs";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PRICE_ID = process.env.STRIPE_PRICE_ID;
// URL de base utilisee pour les redirections apres paiement. Volontairement
// une variable dediee plutot que l'en-tete Origin de la requete : celui-ci
// est controlable par l'appelant, ce qui permettrait sinon de faire creer
// une session Stripe avec une redirection de succes arbitraire.
const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  if (!stripe || !PRICE_ID) {
    console.error("Stripe non configuré (STRIPE_SECRET_KEY / STRIPE_PRICE_ID manquants).");
    return json({ error: GENERIC_ERROR_MESSAGE }, 500, origin);
  }

  let body: { generationId?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Corps de requête invalide." }, 400, origin);
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
      line_items: [{ price: PRICE_ID, quantity: 1 }],
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
