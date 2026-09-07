import { createClient } from "@supabase/supabase-js";
import type { GenerationResult } from "../generateur/types";

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

/**
 * Persiste le resultat complet d'une generation (analyse, questions, CV,
 * questions a poser) une fois qu'elle est terminee, pour pouvoir la
 * reafficher plus tard (F5, retour de paiement Stripe) sans la refaire.
 * Best-effort comme insertGeneration : ne bloque jamais la reponse envoyee
 * au client si Supabase est indisponible.
 */
export async function saveGenerationResult(
  id: string,
  result: GenerationResult,
): Promise<void> {
  if (!supabase) {
    console.error("Supabase non configuré : résultat de génération non persisté.");
    return;
  }

  const { error } = await supabase.from("generations").update({ result }).eq("id", id);
  if (error) {
    console.error("Échec de la sauvegarde du résultat dans generations:", error);
  }
}

/**
 * Lit le statut de paiement et le resultat persiste d'une generation.
 * Distingue une generation introuvable (renvoie null) d'une erreur
 * d'infrastructure (leve une exception) : contrairement a insertGeneration,
 * les appelants (checkout, statut) doivent pouvoir echouer explicitement
 * plutot que de degrader en silence — il s'agit ici de decisions liees au
 * paiement, pas d'un simple tracking.
 */
export async function getGeneration(
  id: string,
): Promise<{ paid: boolean; result: GenerationResult | null } | null> {
  if (!supabase) {
    throw new Error(
      "Supabase non configuré (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants).",
    );
  }

  const { data, error } = await supabase
    .from("generations")
    .select("paid, result")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Échec de la lecture dans la table generations:", error);
    throw new Error("Lecture Supabase impossible.");
  }

  if (!data) {
    return null;
  }

  return {
    paid: data.paid as boolean,
    result: (data.result as GenerationResult | null) ?? null,
  };
}

/**
 * Marque une generation comme payee suite a la confirmation d'un webhook
 * Stripe. Renvoie false en cas d'echec pour que l'appelant (le webhook)
 * puisse renvoyer un statut d'erreur a Stripe et declencher une nouvelle
 * tentative — l'operation est idempotente, la rejouer est sans risque.
 */
export async function markGenerationPaid(
  id: string,
  stripeSessionId: string,
): Promise<boolean> {
  if (!supabase) {
    console.error("Supabase non configuré : paiement non enregistré.");
    return false;
  }

  const { error } = await supabase
    .from("generations")
    .update({ paid: true, stripe_session_id: stripeSessionId })
    .eq("id", id);

  if (error) {
    console.error("Échec de la mise à jour du paiement dans generations:", error);
    return false;
  }

  return true;
}
