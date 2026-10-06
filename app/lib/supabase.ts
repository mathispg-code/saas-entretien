import { createClient } from "@supabase/supabase-js";
import type { GenerationResult } from "../generateur/types";
import type { AccessPlan, AccessRow } from "./access";

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
 *
 * Avec un acces illimite valide (Pass hebdo / abonnement), la generation est
 * creee deja payee et rattachee a cet acces (pour le plafond quotidien) : le
 * feedback, l'analyse CV et l'export PDF fonctionnent alors comme pour un
 * pack achete.
 */
export async function insertGeneration(options?: {
  paid?: boolean;
  accessId?: string;
}): Promise<string | null> {
  if (!supabase) {
    console.error(
      "Supabase non configure (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants) : génération non tracée.",
    );
    return null;
  }

  const { data, error } = await supabase
    .from("generations")
    .insert(
      options?.accessId
        ? { paid: options.paid ?? false, access_id: options.accessId }
        : { paid: options?.paid ?? false },
    )
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

/**
 * Lecture minimale (1 ligne, colonne id) pour garder le projet Supabase
 * actif : le plan gratuit met en pause un projet sans activite. N'ecrit rien
 * et ne renvoie aucune donnee. Leve une exception si Supabase est
 * injoignable, pour que la route de cron renvoie une erreur visible.
 */
export async function pingDatabase(): Promise<void> {
  if (!supabase) {
    throw new Error(
      "Supabase non configuré (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants).",
    );
  }

  const { error } = await supabase.from("generations").select("id").limit(1);

  if (error) {
    console.error("Échec du ping Supabase (keep-alive):", error);
    throw new Error("Ping Supabase impossible.");
  }
}

const ACCESS_COLUMNS =
  "id, email, plan, status, expires_at, current_period_end, cancel_at_period_end, stripe_customer_id, stripe_subscription_id, token_hash";

/**
 * Lectures de la table "access" : comme getGeneration, elles levent une
 * exception en cas d'erreur d'infrastructure (une decision d'acces ne doit
 * jamais degrader en silence), et renvoient null si la ligne n'existe pas.
 */
export async function findAccessByTokenHash(tokenHash: string): Promise<AccessRow | null> {
  if (!supabase) {
    throw new Error(
      "Supabase non configuré (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants).",
    );
  }
  const { data, error } = await supabase
    .from("access")
    .select(ACCESS_COLUMNS)
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (error) {
    console.error("Échec de la lecture dans la table access (jeton):", error);
    throw new Error("Lecture Supabase impossible.");
  }
  return (data as AccessRow | null) ?? null;
}

export async function findAccessBySessionId(sessionId: string): Promise<AccessRow | null> {
  if (!supabase) {
    throw new Error(
      "Supabase non configuré (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants).",
    );
  }
  const { data, error } = await supabase
    .from("access")
    .select(ACCESS_COLUMNS)
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();
  if (error) {
    console.error("Échec de la lecture dans la table access (session):", error);
    throw new Error("Lecture Supabase impossible.");
  }
  return (data as AccessRow | null) ?? null;
}

/**
 * Associe le hash du jeton a un acces, une seule fois : la condition
 * "token_hash is null" rend la reclamation atomique et a usage unique (un
 * identifiant de session Checkout rejoue ensuite ne donne plus rien).
 */
export async function claimAccess(id: string, tokenHash: string): Promise<boolean> {
  if (!supabase) {
    console.error("Supabase non configuré : accès non réclamé.");
    return false;
  }
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("access")
    .update({ token_hash: tokenHash, claimed_at: now, updated_at: now })
    .eq("id", id)
    .is("token_hash", null)
    .select("id");
  if (error) {
    console.error("Échec de la réclamation d'un accès:", error);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

export type NewAccess = {
  sessionId: string;
  email: string | null;
  customerId: string | null;
  plan: AccessPlan;
  status: string;
  expiresAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  subscriptionId: string | null;
};

/**
 * Cree l'acces issu d'un Checkout termine (appele par le webhook). Idempotent
 * sur la session Checkout : un webhook rejoue ne recree rien et ne decale
 * jamais la date de fin d'un pass.
 */
export async function createAccess(access: NewAccess): Promise<boolean> {
  if (!supabase) {
    console.error("Supabase non configuré : accès non enregistré.");
    return false;
  }
  const { error } = await supabase.from("access").upsert(
    {
      stripe_checkout_session_id: access.sessionId,
      email: access.email,
      stripe_customer_id: access.customerId,
      plan: access.plan,
      status: access.status,
      expires_at: access.expiresAt,
      current_period_end: access.currentPeriodEnd,
      cancel_at_period_end: access.cancelAtPeriodEnd,
      stripe_subscription_id: access.subscriptionId,
    },
    { onConflict: "stripe_checkout_session_id", ignoreDuplicates: true },
  );
  if (error) {
    console.error("Échec de la création d'un accès:", error);
    return false;
  }
  return true;
}

/**
 * Met a jour un abonnement (webhook). Renvoie "not_found" si aucune ligne ne
 * correspond (le webhook de fin de Checkout n'est peut-etre pas encore passe :
 * l'appelant demande alors a Stripe de rejouer l'evenement).
 */
export async function updateSubscriptionAccess(
  subscriptionId: string,
  fields: { status: string; currentPeriodEnd?: string | null; cancelAtPeriodEnd?: boolean },
): Promise<"updated" | "not_found" | "error"> {
  if (!supabase) {
    console.error("Supabase non configuré : abonnement non mis à jour.");
    return "error";
  }
  const update: Record<string, unknown> = {
    status: fields.status,
    updated_at: new Date().toISOString(),
  };
  if (fields.currentPeriodEnd !== undefined) update.current_period_end = fields.currentPeriodEnd;
  if (fields.cancelAtPeriodEnd !== undefined) update.cancel_at_period_end = fields.cancelAtPeriodEnd;

  const { data, error } = await supabase
    .from("access")
    .update(update)
    .eq("stripe_subscription_id", subscriptionId)
    .select("id");
  if (error) {
    console.error("Échec de la mise à jour d'un abonnement:", error);
    return "error";
  }
  return (data?.length ?? 0) > 0 ? "updated" : "not_found";
}

/** Nombre de generations creees avec cet acces depuis une date (plafond quotidien). */
export async function countAccessGenerationsSince(
  accessId: string,
  sinceIso: string,
): Promise<number> {
  if (!supabase) {
    throw new Error(
      "Supabase non configuré (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants).",
    );
  }
  const { count, error } = await supabase
    .from("generations")
    .select("id", { count: "exact", head: true })
    .eq("access_id", accessId)
    .gte("created_at", sinceIso);
  if (error) {
    console.error("Échec du décompte des générations d'un accès:", error);
    throw new Error("Lecture Supabase impossible.");
  }
  return count ?? 0;
}
