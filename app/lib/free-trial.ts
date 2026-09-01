/**
 * Limitation temporaire "un essai gratuit par appareil", en attendant un
 * vrai système de comptes/tokens. Basée uniquement sur le localStorage du
 * navigateur : aucune authentification, aucune base de données, facilement
 * contournable (vidage du storage, autre navigateur...). C'est voulu pour
 * cette V1.
 *
 * Tout ce fichier est conçu pour être remplacé d'un bloc quand le vrai
 * système de comptes/tokens arrivera — ne pas éparpiller cette logique
 * ailleurs dans le code.
 */

const STORAGE_KEY = "entretien-ia:free-trial-used";

export const FREE_TRIAL_QUESTION_COUNT = 5;

export const FREE_TRIAL_LOCKED_MESSAGE =
  "Tu as déjà utilisé ta génération gratuite. Reviens bientôt pour la suite !";

export function hasUsedFreeTrial(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function markFreeTrialUsed(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // Stockage indisponible (navigation privée, quotas...) : on ignore.
  }
}
