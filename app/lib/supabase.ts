import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase cote serveur uniquement (cle service_role, jamais exposee
 * au navigateur). A n'importer que depuis des route handlers.
 */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false },
      })
    : null;

/**
 * Cree une ligne dans la table "generations" pour tracer cette generation de
 * questions (gratuite ou non — le statut de paiement est gere a part).
 * Ne bloque jamais la generation : si Supabase est mal configure ou
 * indisponible, on logue l'erreur et on renvoie null plutot que de faire
 * echouer la requete.
 */
export async function insertGeneration(): Promise<string | null> {
  if (!supabase) {
    console.error(
      "Supabase non configure (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants) : génération non tracée.",
    );
    return null;
  }

  const { data, error } = await supabase
    .from("generations")
    .insert({})
    .select("id")
    .single();

  if (error || !data) {
    console.error("Échec de l'insertion dans la table generations:", error);
    return null;
  }

  return data.id as string;
}
