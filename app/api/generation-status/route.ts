import { GENERIC_ERROR_MESSAGE, json, optionsResponse } from "../../lib/api-response";
import { getGeneration } from "../../lib/supabase";

export const runtime = "nodejs";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const id = new URL(request.url).searchParams.get("id");

  if (!id || !UUID_REGEX.test(id)) {
    return json({ error: "Identifiant invalide." }, 400, origin);
  }

  try {
    const generation = await getGeneration(id);
    if (!generation) {
      return json({ error: "Génération introuvable." }, 404, origin);
    }
    return json(generation, 200, origin);
  } catch (error) {
    console.error("Erreur lors de la lecture du statut de génération:", error);
    return json({ error: GENERIC_ERROR_MESSAGE }, 500, origin);
  }
}
