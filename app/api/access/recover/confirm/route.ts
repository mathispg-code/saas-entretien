import { NextResponse } from "next/server";
import { corsHeaders, GENERIC_ERROR_MESSAGE, json, optionsResponse } from "../../../../lib/api-response";
import {
  ACCESS_COOKIE_NAME,
  accessCookieOptions,
  generateAccessToken,
  hashAccessToken,
  isAccessActive,
  toPublicStatus,
} from "../../../../lib/access";
import {
  consumeLoginToken,
  findAccessById,
  replaceAccessToken,
} from "../../../../lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const INVALID_LINK_MESSAGE = "Ce lien est invalide ou a expiré. Demande-en un nouveau.";

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

// Etape 2 du lien magique : le navigateur envoie le jeton lu dans le
// fragment de l'URL (jamais en GET, pour qu'un scanner de liens ou un
// prechargement ne puisse pas le consommer). Le jeton est a usage unique ;
// l'acces change alors d'appareil : le jeton precedent est remplace, donc
// l'ancien appareil est deconnecte.
export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  let body: { token?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Corps de requête invalide." }, 400, origin);
  }

  const token = body.token;
  if (typeof token !== "string" || !TOKEN_PATTERN.test(token)) {
    return json({ error: INVALID_LINK_MESSAGE }, 400, origin);
  }

  try {
    const accessId = await consumeLoginToken(hashAccessToken(token));
    if (!accessId) {
      // Inconnu, deja utilise ou expire : meme reponse dans les trois cas.
      return json({ error: INVALID_LINK_MESSAGE }, 400, origin);
    }

    const access = await findAccessById(accessId);
    if (!access || !isAccessActive(access)) {
      return json({ error: "Cet accès n'est plus actif." }, 400, origin);
    }

    const deviceToken = generateAccessToken();
    if (!(await replaceAccessToken(accessId, hashAccessToken(deviceToken)))) {
      return json({ error: GENERIC_ERROR_MESSAGE }, 500, origin);
    }

    const response = NextResponse.json(toPublicStatus(access), {
      status: 200,
      headers: { ...corsHeaders(origin), "Cache-Control": "no-store" },
    });
    response.cookies.set(ACCESS_COOKIE_NAME, deviceToken, accessCookieOptions());
    return response;
  } catch (error) {
    console.error("Erreur lors de la confirmation d'un lien de récupération:", error);
    return json({ error: GENERIC_ERROR_MESSAGE }, 500, origin);
  }
}
