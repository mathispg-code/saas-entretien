import { createHash } from "node:crypto";
import type Stripe from "stripe";
import { getCgvEntry, isCgvEntryIntact, type CgvRegistryEntry } from "./cgv";
import { renderCgvPdf } from "./cgv/pdf";
import { isConsentTextId } from "./consent";
import {
  buildContractEmail,
  containsDraftMarkers,
  type ContractPlan,
} from "./contract-email";
import { sendEmail } from "./email";
import { SITE_URL } from "./site-url";
import {
  claimContractConfirmation,
  finishContractConfirmation,
  findAccessBySessionId,
  findConsentBySessionId,
} from "./supabase";

/**
 * Email de confirmation du contrat, envoye par le webhook apres la livraison
 * de l'achat et l'enregistrement du consentement. Garanties :
 * - une seule fois par session Stripe, meme si l'evenement est rejoue ou livre
 *   en parallele (verrou atomique en base + cle d'idempotence Resend) ;
 * - un echec temporaire fait repondre 500 au webhook (Stripe rejoue pendant
 *   3 jours), un echec definitif est note et n'est jamais rejoue ;
 * - la livraison de l'achat n'est jamais bloquee par l'email (elle a lieu avant).
 * Renvoie true si le webhook peut repondre 200.
 */
const pdfCache = new Map<string, { buffer: Buffer; sha256: string }>();

// Les versions des CGV sont figees : leur PDF (deterministe) peut etre garde en memoire.
async function cgvPdf(entry: CgvRegistryEntry): Promise<{ buffer: Buffer; sha256: string }> {
  const cached = pdfCache.get(entry.version);
  if (cached) return cached;
  const buffer = await renderCgvPdf(entry.document);
  const built = { buffer, sha256: createHash("sha256").update(buffer).digest("hex") };
  pdfCache.set(entry.version, built);
  return built;
}

// "[CGV](https://...)" -> "CGV" (le texte enregistre est celui envoye a Stripe, en Markdown).
function plainConsentText(markdown: string): string {
  return markdown.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
}

export async function sendContractConfirmation(session: Stripe.Checkout.Session): Promise<boolean> {
  const cgvVersion = session.metadata?.cgvVersion;
  if (!cgvVersion || !isConsentTextId(session.metadata?.consentTextId)) {
    // Session creee avant la mise en place du consentement : pas de version de CGV a joindre.
    console.error("Paiement sans métadonnées de consentement : confirmation de commande non envoyée.");
    return true;
  }

  const claim = await claimContractConfirmation(session.id);
  if (claim.state === "done") return true;
  // Un autre appel envoie en ce moment (ou base injoignable) : Stripe rejouera.
  if (claim.state !== "claimed") return false;

  try {
    return await deliver(session, cgvVersion);
  } catch (error) {
    console.error(
      "Erreur inattendue pendant la confirmation de commande:",
      error instanceof Error ? error.message : "erreur inconnue",
    );
    await finishContractConfirmation(session.id, { status: "retry", lastError: "unexpected_error" });
    return false;
  }
}

async function deliver(session: Stripe.Checkout.Session, cgvVersion: string): Promise<boolean> {
  const finish = (status: "retry" | "failed_permanent" | "skipped_no_email", lastError: string | null) =>
    finishContractConfirmation(session.id, { status, lastError });

  const to = (session.customer_details?.email ?? session.customer_email ?? "").trim();
  if (!to) {
    await finish("skipped_no_email", null);
    return true;
  }

  const consent = await findConsentBySessionId(session.id);
  if (!consent) {
    await finish("retry", "consent_not_found");
    return false;
  }

  const entry = getCgvEntry(cgvVersion);
  if (!entry) {
    console.error("Confirmation de commande : version des CGV inconnue.");
    await finish("failed_permanent", "unknown_cgv_version");
    return true;
  }
  if (!isCgvEntryIntact(entry)) {
    console.error(`Confirmation de commande : la version ${entry.version} des CGV a été modifiée après avoir été figée.`);
    await finish("failed_permanent", "cgv_version_modified");
    return true;
  }

  const plan = (session.metadata?.plan ?? "unique") as ContractPlan;
  const access = plan === "unique" ? null : await findAccessBySessionId(session.id);
  // Date du consentement = heure du paiement (evenement), lue en base : le
  // contenu de l'email reste identique a chaque nouvel essai.
  const consentedAt = new Date(consent.consented_at);

  const email = buildContractEmail({
    to,
    plan,
    reference: `CV-${consent.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
    paidAt: consentedAt,
    amountCents: session.amount_total ?? null,
    currency: session.currency ?? null,
    consentText: plainConsentText(consent.consent_text),
    consentedAt,
    cgvVersionLabel: entry.document.versionLabel,
    accessEndsAt: access?.expires_at ? new Date(access.expires_at) : null,
    renewsAt: access?.current_period_end ? new Date(access.current_period_end) : null,
    siteUrl: SITE_URL,
  });

  // Protection : en mode reel, jamais d'email contenant un brouillon juridique.
  if (session.livemode && containsDraftMarkers(email.text)) {
    console.error("Confirmation de commande non envoyée en mode réel : le contenu contient encore des marqueurs de brouillon.");
    await finish("failed_permanent", "draft_markers");
    return true;
  }

  const pdf = await cgvPdf(entry);
  const result = await sendEmail({
    to,
    subject: email.subject,
    text: email.text,
    html: email.html,
    attachments: [{ filename: `CGV-CandiView-${entry.version}.pdf`, content: pdf.buffer }],
    idempotencyKey: `contract-confirmation/${session.id}`,
  });

  if (result.ok) {
    const saved = await finishContractConfirmation(session.id, {
      status: "sent",
      resendEmailId: result.id,
      templateId: email.templateId,
      cgvVersion: entry.version,
      cgvPdfSha256: pdf.sha256,
      bodyText: email.text,
      consentId: consent.id,
    });
    // L'email EST parti : on ne fait pas rejouer l'evenement si seul le marquage a echoue.
    if (!saved) console.error("Confirmation de commande envoyée mais issue non enregistrée.");
    return true;
  }

  await finish(result.retryable ? "retry" : "failed_permanent", result.reason);
  return !result.retryable;
}
