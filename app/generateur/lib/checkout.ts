import { GENERIC_ERROR_MESSAGE } from "../types";

/**
 * Lance une session Stripe Checkout pour ce generationId et renvoie l'URL de
 * redirection. Utilise a la fois par UnlockBanner et UnlockModal — un seul
 * point d'appel a /api/checkout.
 */
export async function startCheckout(generationId: string): Promise<string> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ generationId }),
  });

  const data: { url?: string; error?: string } = await res.json().catch(() => ({}));

  if (!res.ok || !data.url) {
    throw new Error(data.error ?? GENERIC_ERROR_MESSAGE);
  }

  return data.url;
}
