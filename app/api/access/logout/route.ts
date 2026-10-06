import { NextResponse } from "next/server";
import { corsHeaders, optionsResponse } from "../../../lib/api-response";
import { getAccessFromRequest } from "../../../lib/access-session";
import { ACCESS_COOKIE_NAME, accessCookieOptions } from "../../../lib/access";
import { replaceAccessToken } from "../../../lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

// "Desactiver cet appareil" : efface le cookie ET retire le jeton cote
// serveur (un cookie copie ne fonctionne plus). L'acces se retrouve ensuite
// par le lien envoye par email.
export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  try {
    const access = await getAccessFromRequest(request);
    if (access) {
      await replaceAccessToken(access.id, null);
    }
  } catch (error) {
    console.error("Erreur lors de la désactivation d'un appareil:", error);
  }

  const response = NextResponse.json(
    { ok: true },
    { status: 200, headers: { ...corsHeaders(origin), "Cache-Control": "no-store" } },
  );
  response.cookies.set(ACCESS_COOKIE_NAME, "", { ...accessCookieOptions(), maxAge: 0 });
  return response;
}
