import { GENERIC_ERROR_MESSAGE } from "../generateur/types";

/**
 * Cote navigateur : etat d'acces illimite (Pass hebdo / Illimite) et appels
 * aux routes /api/access/*, /api/checkout et /api/billing-portal. Le cookie
 * d'acces est httpOnly : le navigateur ne le lit jamais, il demande
 * seulement son etat au serveur.
 */
export type ActiveAccessStatus = {
  active: true;
  plan: "hebdo" | "mensuel";
  expiresAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  pastDue: boolean;
  canManage: boolean;
  emailMasked: string | null;
};

export type AccessStatus = { active: false } | ActiveAccessStatus;

// Les appels simultanes (ex. 3 boutons de /tarifs) partagent une seule requete.
let inflight: Promise<AccessStatus> | null = null;

export function fetchAccessStatus(): Promise<AccessStatus> {
  if (!inflight) {
    inflight = fetch("/api/access/status", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<AccessStatus>) : { active: false as const }))
      .catch(() => ({ active: false as const }))
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Lance un Checkout Stripe Pass hebdo / Illimite et renvoie l'URL de redirection. */
export async function startPlanCheckout(plan: "hebdo" | "mensuel"): Promise<string> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
  const data: { url?: string; error?: string } = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? GENERIC_ERROR_MESSAGE);
  }
  return data.url;
}

/** URL du Customer Portal Stripe (resiliation, carte, factures). */
export async function openBillingPortal(): Promise<string> {
  const res = await fetch("/api/billing-portal", { method: "POST" });
  const data: { url?: string; error?: string } = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? GENERIC_ERROR_MESSAGE);
  }
  return data.url;
}

export type ClaimOutcome = "claimed" | "pending" | "already" | "error";

async function claimAccessSession(sessionId: string): Promise<ClaimOutcome> {
  try {
    const res = await fetch("/api/access/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    if (res.ok) return "claimed";
    if (res.status === 404) return "pending";
    if (res.status === 409) return "already";
    return "error";
  } catch {
    return "error";
  }
}

/**
 * Reclame le cookie d'acces au retour de Stripe. Le webhook qui cree l'acces
 * peut arriver avec un leger decalage : on reessaie quelques fois tant que
 * le serveur repond "pas encore" (404).
 */
export async function claimAccessWithRetry(sessionId: string): Promise<ClaimOutcome> {
  const maxAttempts = 8;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const outcome = await claimAccessSession(sessionId);
    if (outcome !== "pending") return outcome;
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  return "pending";
}

/**
 * Demande un lien de recuperation par email. La reponse est volontairement la
 * meme que l'adresse soit connue ou non : seul un refus de limite (429) ou un
 * format d'adresse invalide (400) est distinguable.
 */
export async function requestAccessRecovery(email: string, website: string): Promise<void> {
  const res = await fetch("/api/access/recover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, website }),
  });
  if (res.ok) return;
  const data: { error?: string } = await res.json().catch(() => ({}));
  throw new Error(data.error ?? GENERIC_ERROR_MESSAGE);
}

/** Echange le jeton du lien contre le cookie d'acces de ce navigateur. */
export async function confirmAccessRecovery(token: string): Promise<ActiveAccessStatus> {
  const res = await fetch("/api/access/recover/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const data: (ActiveAccessStatus & { error?: string }) | { active: false; error?: string } =
    await res.json().catch(() => ({ active: false as const }));
  if (!res.ok || !data.active) {
    throw new Error(("error" in data && data.error) || GENERIC_ERROR_MESSAGE);
  }
  return data;
}

/** Desactive cet appareil : efface le cookie et retire le jeton cote serveur. */
export async function logoutAccess(): Promise<void> {
  await fetch("/api/access/logout", { method: "POST" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return `${formatDate(iso)} à ${new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

/** Phrase courte decrivant un acces actif (barre d'etat et /tarifs). */
export function formatAccessSummary(status: ActiveAccessStatus): string {
  if (status.plan === "hebdo") {
    return status.expiresAt
      ? `Accès actif jusqu'au ${formatDateTime(status.expiresAt)}`
      : "Accès actif";
  }
  if (status.cancelAtPeriodEnd && status.currentPeriodEnd) {
    return `Accès actif jusqu'au ${formatDate(status.currentPeriodEnd)} (résiliation programmée)`;
  }
  if (status.currentPeriodEnd) {
    return `Abonnement Illimité actif, prochain renouvellement le ${formatDate(status.currentPeriodEnd)}`;
  }
  return "Abonnement Illimité actif";
}
