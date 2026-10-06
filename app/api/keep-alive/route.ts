import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { GENERIC_ERROR_MESSAGE } from "../../lib/api-response";
import { pingDatabase, purgeRecoveryData } from "../../lib/supabase";

export const runtime = "nodejs";
// Jamais mise en cache : chaque appel doit vraiment toucher Supabase.
export const dynamic = "force-dynamic";

// Appelee une fois par jour par le cron Vercel (voir vercel.json) pour eviter
// la pause automatique du projet Supabase (plan gratuit). Vercel envoie
// automatiquement "Authorization: Bearer <CRON_SECRET>" des que la variable
// d'environnement CRON_SECRET existe sur le projet.
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // Sans secret configure, la route reste fermee : jamais d'acces libre.
  if (!secret) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    await pingDatabase();
    // Purge quotidienne des jetons de connexion expires et des anciennes
    // demandes de recuperation d'acces (voir supabase/access-recovery.sql).
    // Best-effort : un echec n'invalide pas le ping de maintien en activite.
    try {
      await purgeRecoveryData();
    } catch (error) {
      console.error("Échec de la purge des données de récupération:", error);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR_MESSAGE }, { status: 500 });
  }
}
