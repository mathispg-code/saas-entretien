import { NextResponse } from "next/server";
import { corsHeaders, GENERIC_ERROR_MESSAGE, json, optionsResponse } from "../../../lib/api-response";
import {
  ACCESS_COOKIE_NAME,
  accessCookieOptions,
  generateAccessToken,
  hashAccessToken,
  toPublicStatus,
} from "../../../lib/access";
import { claimAccess, findAccessBySessionId } from "../../../lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_ID_REGEX = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/;

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

// Au retour de Stripe Checkout (Pass hebdo / Illimite), le navigateur
// presente l'identifiant de la session pour recevoir son cookie d'acces.
// L'acces n'existe que si le webhook signe de Stripe l'a cree : c'est lui la
// preuve de paiement (404 tant qu'il n'est pas passe, le client reessaie).
// A usage unique : une fois le jeton emis, la meme session ne redonne rien.
export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  let body: { sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Corps de requête invalide." }, 400, origin);
  }

  const { sessionId } = body;
  if (!sessionId || !SESSION_ID_REGEX.test(sessionId)) {
    return json({ error: "Identifiant de session invalide." }, 400, origin);
  }

  try {
    const access = await findAccessBySessionId(sessionId);
    if (!access) {
      return json({ pending: true }, 404, origin);
    }
    if (access.token_hash) {
      return json(
        { error: "Cet accès a déjà été activé sur un appareil." },
        409,
        origin,
      );
    }

    const token = generateAccessToken();
    if (!(await claimAccess(access.id, hashAccessToken(token)))) {
      return json({ error: "Cet accès a déjà été activé sur un appareil." }, 409, origin);
    }

    const response = NextResponse.json(toPublicStatus(access), {
      status: 200,
      headers: { ...corsHeaders(origin), "Cache-Control": "no-store" },
    });
    response.cookies.set(ACCESS_COOKIE_NAME, token, accessCookieOptions());
    return response;
  } catch (error) {
    console.error("Erreur lors de la réclamation d'un accès:", error);
    return json({ error: GENERIC_ERROR_MESSAGE }, 500, origin);
  }
}
