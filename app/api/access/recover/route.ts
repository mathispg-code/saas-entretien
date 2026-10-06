import { after } from "next/server";
import { GENERIC_ERROR_MESSAGE, json, optionsResponse } from "../../../lib/api-response";
import { generateAccessToken, hashAccessToken } from "../../../lib/access";
import { sendEmail } from "../../../lib/email";
import {
  buildRecoveryEmail,
  clientIp,
  isGlobalSendLimitReached,
  isRecoveryRateLimited,
  normalizeEmail,
  pickBestAccess,
  recoveryHash,
  RECOVERY_TOKEN_TTL_MS,
} from "../../../lib/recovery";
import { SITE_URL } from "../../../lib/site-url";
import {
  createLoginToken,
  findAccessesByEmail,
  markRecoveryEmailSent,
  recordRecoveryAttempt,
} from "../../../lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMITED_MESSAGE = "Trop de demandes. Réessaie dans quelques minutes.";

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

// Demande de lien de recuperation d'acces. Ce qui est renvoye ne depend JAMAIS
// de l'existence d'un achat pour cette adresse : meme reponse (200) qu'elle
// soit connue ou non, et la recherche de l'adresse comme l'envoi se font apres
// la reponse (after), donc le temps de reponse ne les trahit pas non plus. Les
// limites comptent les tentatives (pas les envois) pour la meme raison.
export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  let body: { email?: unknown; website?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Corps de requête invalide." }, 400, origin);
  }

  // Champ piege invisible pour les humains : un robot qui le remplit recoit
  // la reponse habituelle, sans rien declencher.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return json({ ok: true }, 200, origin);
  }

  const email = normalizeEmail(body.email);
  if (!email) {
    return json({ error: "Adresse email invalide." }, 400, origin);
  }

  let attemptId: string | null;
  try {
    const emailHash = recoveryHash("email", email);
    const ipHash = recoveryHash("ip", clientIp(request));

    if (await isRecoveryRateLimited(emailHash, ipHash)) {
      return json({ error: RATE_LIMITED_MESSAGE }, 429, origin);
    }
    attemptId = await recordRecoveryAttempt(emailHash, ipHash);
  } catch (error) {
    console.error("Erreur lors du contrôle des limites de récupération:", error);
    return json({ error: GENERIC_ERROR_MESSAGE }, 500, origin);
  }
  if (!attemptId) {
    return json({ error: GENERIC_ERROR_MESSAGE }, 500, origin);
  }

  after(() => sendRecoveryLink(email, attemptId));

  return json({ ok: true }, 200, origin);
}

// Execute apres la reponse. N'enregistre jamais l'adresse ni le jeton dans les
// journaux.
async function sendRecoveryLink(email: string, attemptId: string): Promise<void> {
  try {
    const access = pickBestAccess(await findAccessesByEmail(email));
    if (!access) return; // Adresse inconnue ou sans acces valide : aucun email.

    if (await isGlobalSendLimitReached()) {
      console.error("Plafond global quotidien d'emails de récupération atteint.");
      return;
    }

    const token = generateAccessToken();
    const expiresAt = new Date(Date.now() + RECOVERY_TOKEN_TTL_MS).toISOString();
    if (!(await createLoginToken(access.id, hashAccessToken(token), expiresAt))) return;

    // Le jeton est dans le fragment (#t=...) : il n'est ni envoye au serveur
    // lors de l'ouverture du lien, ni ecrit dans les journaux, ni transmis
    // dans l'en-tete Referer. Il n'est consomme que par un POST explicite.
    const link = `${SITE_URL}/mon-acces/verifier#t=${token}`;
    if ((await sendEmail(buildRecoveryEmail(email, link))).ok) {
      await markRecoveryEmailSent(attemptId);
    }
  } catch (error) {
    console.error(
      "Erreur lors de l'envoi du lien de récupération:",
      error instanceof Error ? error.message : "erreur inconnue",
    );
  }
}
