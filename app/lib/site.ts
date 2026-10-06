/**
 * Domaine canonique du site : `www.candiview.fr`. L'apex `candiview.fr`
 * redirige vers lui (redirection 308 configuree sur Vercel), et c'est
 * l'adresse de l'endpoint du webhook Stripe — Stripe ne suit pas les
 * redirections. Constante sans variable d'environnement : utilisable aussi
 * bien cote serveur que dans les composants client (voir aussi
 * app/lib/site-url.ts pour les liens construits cote serveur).
 */
export const CANONICAL_ORIGIN = "https://www.candiview.fr";
