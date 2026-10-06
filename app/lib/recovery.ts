import { createHmac } from "node:crypto";
import { isAccessActive, type AccessRow } from "./access";
import { listRecoveryAttemptDates, countRecoveryAttempts } from "./supabase";
import type { OutgoingEmail } from "./email";

/**
 * Recuperation d'acces par email (lien magique) : duree de vie du lien,
 * empreintes (adresse et IP ne sont jamais stockees en clair), limites
 * anti-abus et contenu de l'email.
 */
export const RECOVERY_TOKEN_TTL_MS = 15 * 60 * 1000;

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function envInt(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// Par adresse : 1 par minute, 3 par heure, 5 par jour. Par IP : 10 par heure.
// Plafond global : 80 emails REELLEMENT envoyes par jour (les demandes pour
// une adresse inconnue n'en consomment pas).
export const RECOVERY_LIMITS = {
  emailPerMinute: 1,
  emailPerHour: 3,
  emailPerDay: 5,
  ipPerHour: envInt("RECOVERY_IP_HOURLY_LIMIT", 10),
  globalSentPerDay: envInt("RECOVERY_GLOBAL_DAILY_LIMIT", 80),
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Adresse normalisee (minuscules, sans espaces), ou null si le format est invalide. */
export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return null;
  return email;
}

// Empreinte HMAC : une fuite de la base ne permet pas de retrouver les
// adresses ou IP par simple dictionnaire. La cle est derivee de la cle
// serveur Supabase (RECOVERY_HASH_SECRET permet d'en imposer une autre).
function hmacKey(): Buffer {
  const material = process.env.RECOVERY_HASH_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!material) {
    throw new Error("Aucune clé disponible pour les empreintes de récupération.");
  }
  return createHmac("sha256", material).update("candiview-recovery-v1").digest();
}

export function recoveryHash(kind: "email" | "ip", value: string): string {
  return createHmac("sha256", hmacKey()).update(`${kind}:${value}`).digest("hex");
}

/** IP du client telle que fournie par l'hebergeur (Vercel ecrase x-forwarded-for). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Limites par adresse et par IP. Elles comptent les TENTATIVES, que
 * l'adresse soit connue ou non : le blocage est identique dans les deux cas
 * et ne revele rien sur l'existence d'un achat.
 */
export async function isRecoveryRateLimited(
  emailHash: string,
  ipHash: string,
  now: number = Date.now(),
): Promise<boolean> {
  const [emailDates, ipCount] = await Promise.all([
    listRecoveryAttemptDates(emailHash, new Date(now - DAY).toISOString()),
    countRecoveryAttempts({ ipHash }, new Date(now - HOUR).toISOString()),
  ]);

  const within = (windowMs: number) => emailDates.filter((d) => d > now - windowMs).length;
  return (
    within(MINUTE) >= RECOVERY_LIMITS.emailPerMinute ||
    within(HOUR) >= RECOVERY_LIMITS.emailPerHour ||
    within(DAY) >= RECOVERY_LIMITS.emailPerDay ||
    ipCount >= RECOVERY_LIMITS.ipPerHour
  );
}

/** Plafond global : emails reellement envoyes sur les dernieres 24 h. */
export async function isGlobalSendLimitReached(now: number = Date.now()): Promise<boolean> {
  const sent = await countRecoveryAttempts({ sentOnly: true }, new Date(now - DAY).toISOString());
  return sent >= RECOVERY_LIMITS.globalSentPerDay;
}

/**
 * Meilleur acces valide parmi ceux d'une adresse : un abonnement actif avant
 * un pass hebdomadaire encore valide (le plus tardif d'abord).
 */
export function pickBestAccess(rows: AccessRow[]): AccessRow | null {
  const active = rows.filter((row) => isAccessActive(row));
  const subscription = active.find((row) => row.plan === "mensuel");
  if (subscription) return subscription;
  return (
    active
      .filter((row) => row.plan === "hebdo")
      .sort((a, b) => new Date(b.expires_at ?? 0).getTime() - new Date(a.expires_at ?? 0).getTime())[0] ??
    null
  );
}

export function buildRecoveryEmail(to: string, link: string): OutgoingEmail {
  const minutes = RECOVERY_TOKEN_TTL_MS / MINUTE;
  const text = [
    "Bonjour,",
    "",
    "Voici ton lien pour retrouver ton accès CandiView sur cet appareil :",
    "",
    link,
    "",
    `Ce lien est valable ${minutes} minutes et ne peut servir qu'une seule fois.`,
    "Ouvre-le dans le navigateur où tu utilises CandiView (dans l'appli Gmail, il s'ouvre parfois dans un navigateur intégré : l'accès sera alors activé dans celui-ci).",
    "",
    "Si tu n'es pas à l'origine de cette demande, ignore simplement ce message : rien ne sera modifié.",
    "",
    "L'équipe CandiView — contact@candiview.fr",
  ].join("\n");

  const html = `<!doctype html>
<html lang="fr"><body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px">
<p style="margin:0 0 4px;font-size:18px;font-weight:bold">Candi<span style="color:#10b981">View</span></p>
<p style="margin:16px 0">Voici ton lien pour retrouver ton accès CandiView sur cet appareil.</p>
<p style="margin:24px 0"><a href="${link}" style="display:inline-block;background:#10b981;color:#06251a;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px">Retrouver mon accès</a></p>
<p style="margin:16px 0;font-size:14px;color:#334155">Ce lien est valable ${minutes} minutes et ne peut servir qu'une seule fois. Ouvre-le dans le navigateur où tu utilises CandiView (dans l'appli Gmail, il s'ouvre parfois dans un navigateur intégré : l'accès sera alors activé dans celui-ci).</p>
<p style="margin:16px 0;font-size:14px;color:#334155">Si le bouton ne fonctionne pas, copie cette adresse dans ton navigateur :<br><span style="word-break:break-all">${link}</span></p>
<p style="margin:16px 0;font-size:13px;color:#64748b">Si tu n'es pas à l'origine de cette demande, ignore simplement ce message : rien ne sera modifié.</p>
</div></body></html>`;

  return { to, subject: "Ton lien pour retrouver ton accès CandiView", text, html };
}
