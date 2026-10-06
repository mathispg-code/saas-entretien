import type Stripe from "stripe";
import { HEBDO_DURATION_MS } from "../../../lib/access";
import { consentMessageForStripe, isConsentTextId } from "../../../lib/consent";
import { SITE_URL } from "../../../lib/site-url";
import { stripe } from "../../../lib/stripe";
import {
  createAccess,
  findAccessBySessionId,
  getGeneration,
  insertConsent,
  markGenerationPaid,
  updateSubscriptionAccess,
} from "../../../lib/supabase";

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

  // Chaque handler renvoie false pour qu'on reponde 500 : Stripe reessaie
  // alors l'evenement (jusqu'a 3 jours). Tous sont idempotents.
  let success = true;
  switch (event.type) {
    case "checkout.session.completed":
      success = await handleCheckoutCompleted(event.data.object, event.created);
      break;
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      success = await handleSubscriptionChange(event.data.object);
      break;
    case "invoice.payment_failed":
      success = await handlePaymentFailed(event.data.object);
      break;
  }

  return success ? new Response("ok", { status: 200 }) : new Response("Échec du traitement.", { status: 500 });
}

function isResourceMissing(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "resource_missing"
  );
}

function customerId(customer: string | { id: string } | null | undefined): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

/**
 * Etat d'un abonnement tel que Stripe le voit AU MOMENT du traitement : les
 * evenements peuvent arriver dans le desordre, relire l'objet evite
 * d'ecraser un etat recent par un plus ancien. Si l'objet n'existe pas cote
 * Stripe (evenement de test sans abonnement reel), on retombe sur la charge
 * utile de l'evenement.
 */
async function currentSubscription(
  subscriptionId: string,
  fallback: Stripe.Subscription | null,
): Promise<Stripe.Subscription | null> {
  try {
    return await stripe!.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    if (isResourceMissing(error)) return fallback;
    throw error;
  }
}

function subscriptionFields(subscription: Stripe.Subscription) {
  // Depuis les versions recentes de l'API, la fin de periode est portee par
  // les lignes de l'abonnement et non plus par l'abonnement lui-meme.
  const periodEnd = subscription.items.data[0]?.current_period_end;
  return {
    status: subscription.status,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end || subscription.cancel_at !== null,
  };
}

// Paiement abouti : on livre l'achat (generation payee ou acces), puis on
// enregistre la preuve du consentement. Les deux etapes sont idempotentes : en
// cas d'echec de l'une, la reponse 500 fait rejouer l'evenement par Stripe.
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  eventCreated: number,
): Promise<boolean> {
  const outcome = await grantPurchase(session, eventCreated);
  if (outcome === "failed") return false;
  if (outcome === "skipped") return true;
  return recordConsent(session, eventCreated);
}

async function recordConsent(
  session: Stripe.Checkout.Session,
  eventCreated: number,
): Promise<boolean> {
  const cgvVersion = session.metadata?.cgvVersion;
  const consentTextId = session.metadata?.consentTextId;
  if (!cgvVersion || !isConsentTextId(consentTextId)) {
    // Session creee avant la mise en place du consentement Stripe : rien a recopier.
    console.error("Paiement sans métadonnées de consentement : preuve non enregistrée dans consents.");
    return true;
  }

  const plan = (session.metadata?.plan ?? "unique") as "unique" | "hebdo" | "mensuel";
  const stripeConsent = session.consent?.terms_of_service === "accepted" ? "accepted" : null;
  if (!stripeConsent) {
    // Ne devrait pas arriver (la case est obligatoire) : on l'enregistre quand meme, visiblement.
    console.error("Paiement abouti sans consentement enregistré par Stripe : anomalie à examiner.");
  }

  // Liens vers l'achat, seulement s'ils existent (cle etrangere).
  let generationId: string | null = null;
  let accessId: string | null = null;
  if (plan === "unique") {
    const candidate = session.metadata?.generationId;
    if (candidate && (await getGeneration(candidate))) generationId = candidate;
  } else {
    accessId = (await findAccessBySessionId(session.id))?.id ?? null;
  }

  return insertConsent({
    sessionId: session.id,
    plan,
    cgvVersion,
    consentTextId,
    // Texte reellement affiche sur la page de paiement (conserve par Stripe sur la session).
    consentText:
      session.custom_text?.terms_of_service_acceptance?.message ??
      consentMessageForStripe(consentTextId, `${SITE_URL}/cgv`),
    stripeConsent,
    // Heure du paiement : le consentement a ete donne au plus tard a cet instant.
    consentedAt: new Date(eventCreated * 1000).toISOString(),
    email: session.customer_details?.email ?? session.customer_email ?? null,
    generationId,
    accessId,
  });
}

type PurchaseOutcome = "granted" | "skipped" | "failed";

async function grantPurchase(
  session: Stripe.Checkout.Session,
  eventCreated: number,
): Promise<PurchaseOutcome> {
  const done = (ok: boolean): PurchaseOutcome => (ok ? "granted" : "failed");
  const plan = session.metadata?.plan;
  const generationId = session.metadata?.generationId;

  // Pack "Fiche unique" : une generation precise passe en "payee". Inchange.
  if (!plan) {
    if (!generationId) {
      console.error("checkout.session.completed reçu sans generationId ni plan en metadata.");
      return "skipped";
    }
    // Idempotent (remettre paid=true n'a aucun effet de bord).
    return done(await markGenerationPaid(generationId, session.id));
  }

  const email = session.customer_details?.email ?? session.customer_email ?? null;

  // Pass hebdo : acces illimite 7 jours a compter du paiement, sans reconduction.
  if (plan === "hebdo") {
    if (session.payment_status !== "paid") {
      console.error("Pass hebdo : session terminée mais non payée, accès non créé.");
      return "skipped";
    }
    return done(await createAccess({
      sessionId: session.id,
      email,
      customerId: customerId(session.customer),
      plan: "hebdo",
      status: "active",
      expiresAt: new Date(eventCreated * 1000 + HEBDO_DURATION_MS).toISOString(),
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      subscriptionId: null,
    }));
  }

  // Illimite : abonnement mensuel, tant que Stripe le dit actif.
  if (plan === "mensuel") {
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    if (!subscriptionId) {
      console.error("Abonnement : session terminée sans abonnement associé.");
      return "skipped";
    }
    const subscription = await currentSubscription(subscriptionId, null);
    const fields = subscription
      ? subscriptionFields(subscription)
      : { status: "active", currentPeriodEnd: null, cancelAtPeriodEnd: false };
    return done(await createAccess({
      sessionId: session.id,
      email,
      customerId: customerId(session.customer),
      plan: "mensuel",
      status: fields.status,
      expiresAt: null,
      currentPeriodEnd: fields.currentPeriodEnd,
      cancelAtPeriodEnd: fields.cancelAtPeriodEnd,
      subscriptionId,
    }));
  }

  console.error(`checkout.session.completed : offre inconnue "${plan}".`);
  return "skipped";
}

async function syncSubscription(
  subscriptionId: string,
  fallback: Stripe.Subscription | null,
): Promise<boolean> {
  const subscription = await currentSubscription(subscriptionId, fallback);
  if (!subscription) return true;

  const fields = subscriptionFields(subscription);
  const result = await updateSubscriptionAccess(subscriptionId, fields);
  if (result === "not_found") {
    // Abonnement jamais finalise (paiement refuse des le Checkout) : rien a
    // mettre a jour. Sinon le webhook de fin de Checkout n'est peut-etre pas
    // encore passe : on demande a Stripe de rejouer l'evenement.
    return fields.status === "incomplete" || fields.status === "incomplete_expired";
  }
  return result === "updated";
}

// updated : renouvellement, resiliation programmee, passage en impaye... ;
// deleted : fin effective de l'abonnement (statut "canceled").
async function handleSubscriptionChange(subscription: Stripe.Subscription): Promise<boolean> {
  return syncSubscription(subscription.id, subscription);
}

// Echec de paiement d'une facture d'abonnement : Stripe relance le paiement ;
// l'abonnement passe en "past_due" (acces conserve pendant les relances, coupe
// s'il devient "canceled" ou "unpaid").
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<boolean> {
  const reference = invoice.parent?.subscription_details?.subscription;
  const subscriptionId = typeof reference === "string" ? reference : reference?.id;
  if (!subscriptionId) {
    return true; // Facture hors abonnement : rien a faire.
  }

  try {
    const subscription = await stripe!.subscriptions.retrieve(subscriptionId);
    const result = await updateSubscriptionAccess(subscriptionId, subscriptionFields(subscription));
    return result !== "error";
  } catch (error) {
    if (!isResourceMissing(error)) throw error;
    // Pas d'objet cote Stripe (evenement de test) : on applique l'etat attendu.
    const result = await updateSubscriptionAccess(subscriptionId, { status: "past_due" });
    return result !== "error";
  }
}
