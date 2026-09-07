/**
 * Trace si cet appareil a deja paye au moins une fois (n'importe quelle
 * generation). Une fois vrai, ca leve le blocage "un essai gratuit par
 * appareil" pour permettre une nouvelle generation, et debloque les options
 * 8/12 questions — sans jamais rendre gratuit le feedback/l'analyse CV/le
 * PDF d'une nouvelle generation, qui necessitent toujours leur propre
 * paiement (voir paid dans page.tsx, verifie par generationId cote serveur).
 *
 * Comme free-trial.ts et generation-id.ts : localStorage uniquement, aucune
 * authentification, facilement contournable — accepte pour cette V1 sans
 * systeme de comptes.
 */

const STORAGE_KEY = "entretien-ia:has-ever-paid";

export function hasEverPaid(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function markHasEverPaid(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // Stockage indisponible (navigation privée, quotas...) : on ignore.
  }
}
