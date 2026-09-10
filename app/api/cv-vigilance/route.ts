import { GENERIC_ERROR_MESSAGE, PAYMENT_REQUIRED_MESSAGE, json, optionsResponse } from "../../lib/api-response";
import { isPaywallBypassed } from "../../lib/dev-bypass";
import { getGeneration } from "../../lib/supabase";

export const runtime = "nodejs";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Seul endroit qui sert reellement le contenu des points de vigilance CV
// (contenu payant). /api/generate et /api/generation-status ne renvoient
// jamais ce contenu, meme apres paiement — ils se contentent d'un booleen
// "hasCv" pour savoir si cet onglet doit exister.
export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const id = new URL(request.url).searchParams.get("id");

  if (!id || !UUID_REGEX.test(id)) {
    return json({ error: "Identifiant invalide." }, 400, origin);
  }

  let generation;
  try {
    generation = await getGeneration(id);
  } catch (error) {
    console.error("Erreur lors de la lecture de l'analyse CV:", error);
    return json({ error: GENERIC_ERROR_MESSAGE }, 500, origin);
  }

  if (!generation || !generation.result?.cvVigilance) {
    return json({ error: "Aucune analyse CV disponible pour cette génération." }, 404, origin);
  }

  if (!generation.paid && !isPaywallBypassed()) {
    return json({ error: PAYMENT_REQUIRED_MESSAGE }, 402, origin);
  }

  return json({ cvVigilance: generation.result.cvVigilance }, 200, origin);
}
