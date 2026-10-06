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

export type OutgoingEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
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
 * Renvoie true si l'email a ete accepte par Resend. Ne journalise jamais
 * l'adresse du destinataire ni le contenu du message (il contient un lien
 * d'acces) : uniquement le statut.
 */
export async function sendEmail(email: OutgoingEmail): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("Envoi d'email impossible : RESEND_API_KEY manquante.");
    return false;
  }

  try {
    const res = await fetch(resendEndpoint(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM?.trim() || DEFAULT_FROM,
        to: [email.to],
        reply_to: REPLY_TO,
        subject: email.subject,
        text: email.text,
        html: email.html,
      }),
    });
    if (!res.ok) {
      console.error(`Resend a refusé l'envoi (HTTP ${res.status}).`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Échec de la requête vers Resend:", error instanceof Error ? error.message : "erreur réseau");
    return false;
  }
}
