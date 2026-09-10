import { GENERIC_ERROR_MESSAGE, json, optionsResponse } from "../../lib/api-response";
import { isPaywallBypassed } from "../../lib/dev-bypass";
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

    // Les points de vigilance CV sont du contenu payant : jamais renvoyes
    // ici, quel que soit le statut de paiement. hasCv indique seulement si
    // un onglet CV doit exister ; le contenu se recupere via
    // /api/cv-vigilance une fois la generation payee.
    const { cvVigilance, ...resultWithoutCv } = generation.result ?? {};
    const hasCv = Boolean(generation.result?.cvVigilance);

    return json(
      {
        paid: generation.paid || isPaywallBypassed(),
        result: generation.result ? { ...resultWithoutCv, hasCv } : null,
      },
      200,
      origin,
    );
  } catch (error) {
    console.error("Erreur lors de la lecture du statut de génération:", error);
    return json({ error: GENERIC_ERROR_MESSAGE }, 500, origin);
  }
}
