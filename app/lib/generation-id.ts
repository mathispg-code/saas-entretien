/**
 * Persiste l'id de la derniere generation de questions (table Supabase
 * "generations"), pour le reutiliser sur les appels suivants (feedback,
 * export PDF...) et, a terme, verifier son statut de paiement (etape 3).
 * Meme logique de stockage que free-trial.ts : localStorage uniquement,
 * remplacable en bloc quand un vrai systeme de comptes arrivera.
 */

const STORAGE_KEY = "entretien-ia:last-generation-id";

export function getStoredGenerationId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeGenerationId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Stockage indisponible (navigation privée, quotas...) : on ignore.
  }
}

export function clearStoredGenerationId(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Stockage indisponible : on ignore.
  }
}
