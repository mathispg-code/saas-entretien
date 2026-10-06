import { NextResponse } from "next/server";
import { corsHeaders, optionsResponse } from "../../../lib/api-response";
import { getAccessFromRequest } from "../../../lib/access-session";
import { toPublicStatus } from "../../../lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

// Etat d'acces de l'appareil (cookie), pour adapter l'interface. Ne sert qu'a
// l'affichage : chaque route payante re-verifie l'acces cote serveur.
export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const headers = { ...corsHeaders(origin), "Cache-Control": "no-store" };

  try {
    const access = await getAccessFromRequest(request);
    return NextResponse.json(toPublicStatus(access), { headers });
  } catch (error) {
    console.error("Erreur lors de la lecture du statut d'accès:", error);
    // Panne d'infrastructure : on n'affirme rien (l'interface retombe sur
    // l'etat "sans acces", sans bloquer qui que ce soit cote serveur).
    return NextResponse.json({ active: false }, { headers });
  }
}
