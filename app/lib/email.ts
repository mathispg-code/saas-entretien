/**
 * Envoi d'emails transactionnels via l'API REST de Resend (sans SDK). Le
 * domaine d'envoi est un sous-domaine dedie (send.candiview.fr) verifie chez
 * Resend (SPF/DKIM), pour ne pas exposer la reputation du domaine principal.
 */
const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "CandiView <acces@send.candiview.fr>";
// Les reponses des utilisateurs arrivent sur l'adresse de contact, pas sur
// l'adresse d'envoi (qui n'est pas relevee).
const REPLY_TO = "contact@candiview.fr";

export type EmailAttachment = { filename: string; content: Buffer };

export type OutgoingEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: EmailAttachment[];
  // Cle d'idempotence Resend ("<evenement>/<entite>", 256 caracteres max,
  // conservee 24 h) : un meme envoi rejoue avec la meme cle ne part qu'une fois.
  idempotencyKey?: string;
};

export type SendResult =
  | { ok: true; id: string | null }
  | {
      ok: false;
      // true : un nouvel essai peut reussir (reseau, limite de debit, erreur
      // serveur, configuration a corriger) ; false : inutile de reessayer.
      retryable: boolean;
      status: number | null;
      reason: string;
    };

// Hors production uniquement, RESEND_API_URL permet de pointer vers un faux
// serveur local pour tester l'envoi sans vrai email. Ignore en production.
function resendEndpoint(): string {
  if (process.env.NODE_ENV !== "production" && process.env.RESEND_API_URL) {
    return process.env.RESEND_API_URL;
  }
  return RESEND_ENDPOINT;
}

/**
 * Domaines reserves aux tests ou a la documentation (RFC 2606) : jamais de vrai
 * destinataire. Evite qu'une donnee de test (adresse @example.invalid d'un
 * webhook simule, par exemple) declenche un VRAI envoi, qui rebondirait chez
 * Resend et abimerait la reputation du domaine d'envoi.
 */
function isReservedTestAddress(address: string): boolean {
  const domain = address.split("@").pop()?.trim().toLowerCase() ?? "";
  return /(^|\.)example\.(com|net|org)$/.test(domain) || /\.(invalid|test|example|localhost)$/.test(domain);
}

/**
 * Definitif seulement pour un contenu refuse (400, 422) ou une cle
 * d'idempotence reutilisee avec un autre contenu. Tout le reste est reessaye :
 * cle API ou domaine a corriger (401, 403), limite de debit (429), erreur
 * serveur (5xx), envoi simultane avec la meme cle (409), reseau.
 */
function isRetryable(status: number, errorName: string | null): boolean {
  if (status === 400 || status === 422) return false;
  if (status === 409 && errorName === "invalid_idempotent_request") return false;
  return true;
}

/**
 * Ne journalise jamais l'adresse du destinataire ni le contenu du message (il
 * peut contenir un lien d'acces ou des informations de commande) : uniquement
 * le statut et le nom de l'erreur.
 */
export async function sendEmail(email: OutgoingEmail): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("Envoi d'email impossible : RESEND_API_KEY manquante.");
    return { ok: false, retryable: true, status: null, reason: "missing_api_key" };
  }

  // Garde-fou : jamais d'envoi reel vers un domaine reserve (les faux serveurs de
  // test, utilises hors production uniquement, ne sont pas concernes).
  if (resendEndpoint() === RESEND_ENDPOINT && isReservedTestAddress(email.to)) {
    console.error("Envoi refusé : adresse d'un domaine réservé aux tests.");
    return { ok: false, retryable: false, status: null, reason: "reserved_test_domain" };
  }

  try {
    const res = await fetch(resendEndpoint(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(email.idempotencyKey ? { "Idempotency-Key": email.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM?.trim() || DEFAULT_FROM,
        to: [email.to],
        reply_to: REPLY_TO,
        subject: email.subject,
        text: email.text,
        html: email.html,
        ...(email.attachments?.length
          ? {
              attachments: email.attachments.map((a) => ({
                filename: a.filename,
                content: a.content.toString("base64"),
              })),
            }
          : {}),
      }),
    });

    const data: { id?: string; name?: string } = await res.json().catch(() => ({}));
    if (!res.ok) {
      const name = typeof data.name === "string" ? data.name : null;
      console.error(`Resend a refusé l'envoi (HTTP ${res.status}${name ? `, ${name}` : ""}).`);
      return {
        ok: false,
        retryable: isRetryable(res.status, name),
        status: res.status,
        reason: name ?? `http_${res.status}`,
      };
    }
    return { ok: true, id: typeof data.id === "string" ? data.id : null };
  } catch (error) {
    console.error("Échec de la requête vers Resend:", error instanceof Error ? error.message : "erreur réseau");
    return { ok: false, retryable: true, status: null, reason: "network_error" };
  }
}
