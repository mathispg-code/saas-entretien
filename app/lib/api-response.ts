import { NextResponse } from "next/server";
import { CANONICAL_ORIGIN } from "./site";

export const GENERIC_ERROR_MESSAGE = "Une erreur est survenue, réessaie dans quelques instants.";
export const PAYMENT_REQUIRED_MESSAGE =
  "Cette fonctionnalité nécessite de débloquer l'accès complet pour cette fiche de poste (3,99 € par fiche de poste).";
const ALLOWED_ORIGIN = CANONICAL_ORIGIN;

export function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
  if (origin === ALLOWED_ORIGIN) {
    headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGIN;
  }
  return headers;
}

export function json(data: unknown, status: number, origin: string | null) {
  return NextResponse.json(data, { status, headers: corsHeaders(origin) });
}

export function optionsResponse(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}
