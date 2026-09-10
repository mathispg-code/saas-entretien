// Bypass local du paywall pour tester/screenshoter les fonctionnalites
// payantes sans repasser par un vrai paiement Stripe a chaque fois (contenu
// marketing). BYPASS_PAYWALL ne doit exister que dans .env.local, jamais
// dans .env.local.example ni dans les variables Vercel.
//
// Les deux checks ci-dessous sont evalues AVANT de lire BYPASS_PAYWALL et
// suffisent chacun seul a bloquer le bypass, y compris si la variable
// fuitait par erreur sur Vercel :
// - VERCEL est injecte automatiquement par Vercel sur toute fonction
//   deployee (Production, Preview, meme `vercel dev`).
// - NODE_ENV vaut "production" des que le code tourne en vrai build de prod
//   (`next build && next start`), meme hors Vercel.
export function isPaywallBypassed(): boolean {
  if (process.env.VERCEL) return false;
  if (process.env.NODE_ENV === "production") return false;
  return process.env.BYPASS_PAYWALL === "true";
}
