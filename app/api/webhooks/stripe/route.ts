import type Stripe from "stripe";
import { stripe } from "../../../lib/stripe";
import { markGenerationPaid } from "../../../lib/supabase";

export const runtime = "nodejs";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Route appelee par les serveurs Stripe, jamais par un navigateur : pas de
// CORS ni de OPTIONS ici, la securite repose entierement sur la verification
// de la signature ci-dessous.
export async function POST(request: Request) {
  if (!stripe || !webhookSecret) {
    console.error("Stripe non configuré (STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET manquants).");
    return new Response("Configuration serveur invalide.", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Signature manquante.", { status: 400 });
  }

  // Le corps doit rester brut (non parse) : la verification de signature
  // Stripe recalcule un HMAC sur les octets exacts envoyes.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Signature de webhook Stripe invalide:", error);
    return new Response("Signature invalide.", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const generationId = session.metadata?.generationId;

    if (!generationId) {
      console.error("checkout.session.completed reçu sans generationId en metadata.");
      return new Response("ok", { status: 200 });
    }

    // Idempotent (remettre paid=true n'a aucun effet de bord) : en cas
    // d'echec on renvoie une erreur pour que Stripe reessaie l'envoi.
    const success = await markGenerationPaid(generationId, session.id);
    if (!success) {
      return new Response("Échec de la mise à jour.", { status: 500 });
    }
  }

  return new Response("ok", { status: 200 });
}
