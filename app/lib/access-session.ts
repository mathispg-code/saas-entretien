import { hashAccessToken, isAccessActive, readAccessToken, type AccessRow } from "./access";
import { findAccessByTokenHash } from "./supabase";

/** Ligne d'acces rattachee au cookie de la requete (valide ou non), sinon null. */
export async function getAccessFromRequest(request: Request): Promise<AccessRow | null> {
  const token = readAccessToken(request);
  if (!token) return null;
  return findAccessByTokenHash(hashAccessToken(token));
}

/** Acces illimite valide (Pass hebdo non expire / abonnement actif), sinon null. */
export async function getActiveAccess(request: Request): Promise<AccessRow | null> {
  const row = await getAccessFromRequest(request);
  return row && isAccessActive(row) ? row : null;
}
