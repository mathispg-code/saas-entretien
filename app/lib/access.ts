import { createHash, randomBytes } from "node:crypto";

/**
 * Acces "Pass hebdo" / "Illimite" : un acheteur est reconnu par un cookie
 * httpOnly contenant un jeton aleatoire ; seul le hash SHA-256 du jeton est
 * stocke en base (table "access"). Pas de compte : l'acces est lie a
 * l'appareil/navigateur, comme annonce dans les CGV. Ce cookie est
 * strictement necessaire au service (pas de consentement requis).
 */
export const ACCESS_COOKIE_NAME = "candiview_access";
const ACCESS_COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export const HEBDO_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// Plafond anti-abus ("usage raisonnable"), non affiche : nombre maximal de
// generations sur 24 h glissantes avec un acces illimite. Reglable via
// ACCESS_DAILY_GENERATION_LIMIT.
const DEFAULT_DAILY_GENERATION_LIMIT = 10;
export const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

export type AccessPlan = "hebdo" | "mensuel";

export type AccessRow = {
  id: string;
  email: string | null;
  plan: AccessPlan;
  status: string;
  expires_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  token_hash: string | null;
};

export function generateAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashAccessToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Lit le jeton du cookie d'acces ; null s'il est absent ou mal forme. */
export function readAccessToken(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== ACCESS_COOKIE_NAME) continue;
    const value = part.slice(separator + 1).trim();
    return TOKEN_PATTERN.test(value) ? value : null;
  }
  return null;
}

export function accessCookieOptions() {
  return {
    httpOnly: true,
    // Pas de "Secure" en developpement local (http) ; toujours en production.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ACCESS_COOKIE_MAX_AGE_SECONDS,
  };
}

/**
 * Regle d'acces, verifiee cote serveur a chaque requete :
 * - Pass hebdo : date de fin pas encore atteinte (coupure automatique).
 * - Abonnement : statut Stripe "active" ou "trialing" ; "past_due" (paiement
 *   echoue, Stripe relance) garde l'acces pendant les relances. Il est coupe
 *   quand Stripe passe l'abonnement en "canceled" ou "unpaid".
 */
export function isAccessActive(row: AccessRow, now: Date = new Date()): boolean {
  if (row.plan === "hebdo") {
    return (
      row.status === "active" &&
      row.expires_at !== null &&
      new Date(row.expires_at).getTime() > now.getTime()
    );
  }
  return row.status === "active" || row.status === "trialing" || row.status === "past_due";
}

export function dailyGenerationLimit(): number {
  const parsed = Number.parseInt(process.env.ACCESS_DAILY_GENERATION_LIMIT ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_GENERATION_LIMIT;
}

/** Etat d'acces expose au navigateur (jamais de jeton ni d'identifiant Stripe). */
export type PublicAccessStatus =
  | { active: false }
  | {
      active: true;
      plan: AccessPlan;
      expiresAt: string | null;
      currentPeriodEnd: string | null;
      cancelAtPeriodEnd: boolean;
      pastDue: boolean;
      canManage: boolean;
    };

export function toPublicStatus(row: AccessRow | null): PublicAccessStatus {
  if (!row || !isAccessActive(row)) {
    return { active: false };
  }
  return {
    active: true,
    plan: row.plan,
    expiresAt: row.plan === "hebdo" ? row.expires_at : null,
    currentPeriodEnd: row.plan === "mensuel" ? row.current_period_end : null,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    pastDue: row.status === "past_due",
    canManage: row.plan === "mensuel" && Boolean(row.stripe_customer_id),
  };
}
