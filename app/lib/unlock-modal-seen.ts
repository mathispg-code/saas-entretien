/**
 * Trace, par generation (via son UUID), si la popup automatique de
 * conversion (UnlockModal) a deja ete montree — pour ne l'afficher qu'une
 * fois, meme apres un rechargement de page. Meme logique de stockage que
 * free-trial.ts et generation-id.ts : localStorage uniquement.
 */

const STORAGE_KEY_PREFIX = "entretien-ia:unlock-modal-seen:";

export function hasSeenUnlockModal(generationId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY_PREFIX + generationId) === "true";
  } catch {
    return false;
  }
}

export function markUnlockModalSeen(generationId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY_PREFIX + generationId, "true");
  } catch {
    // Stockage indisponible (navigation privée, quotas...) : on ignore.
  }
}
