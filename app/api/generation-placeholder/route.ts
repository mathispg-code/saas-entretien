import { GENERIC_ERROR_MESSAGE, json, optionsResponse } from "../../lib/api-response";
import { insertGeneration } from "../../lib/supabase";

export const runtime = "nodejs";

// Filet de secours pour ouvrir UnlockModal avant toute generation (boutons
// "8"/"12 questions" ou "Generation gratuite deja utilisee" verrouilles) :
// dans l'immense majorite des cas, un generationId existe deja (une
// generation gratuite a deja eu lieu) et est reutilise directement cote
// client sans jamais appeler cette route. Elle ne sert que si cet id est
// introuvable (ex. Supabase indisponible au moment de la generation
// initiale) — cree une ligne vide, juste pour avoir un id valide a associer
// au paiement Stripe. Contrairement a insertGeneration (utilisee dans
// /api/generate, qui degrade en silence), on echoue explicitement ici : sans
// id utilisable, ouvrir la modale de paiement n'aurait aucun sens.
export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  const id = await insertGeneration();
  if (!id) {
    return json({ error: GENERIC_ERROR_MESSAGE }, 500, origin);
  }

  return json({ id }, 200, origin);
}
