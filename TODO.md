# TODO avant mise en ligne définitive

Valeurs provisoires utilisées dans le code, à remplacer une fois les
informations définitives connues.

## Adresse email de feedback

Actuellement : `ton-email@exemple.com` (lien "Un bug ? Une suggestion ?" dans le footer).
À remplacer dans [app/components/SiteFooter.tsx](app/components/SiteFooter.tsx).

## Stripe - offres à implémenter

Deux offres présentes sur [/tarifs](app/tarifs/page.tsx) et dans la modale
[UnlockModal.tsx](app/generateur/components/UnlockModal.tsx) restent en
simulation (log + retour visuel), en attendant leur vrai branchement Stripe :

- **Pass hebdo (6,99€)** : paiement **unique** (pas un abonnement) — Stripe
  Checkout en mode `payment`, comme "Fiche unique". Donne un accès illimité
  pendant 7 jours puis s'arrête automatiquement, sans reconduction. Il faudra
  ajouter la logique d'expiration après 7 jours (probablement une date de fin
  stockée sur la génération/l'appareil, à vérifier côté serveur comme le
  statut `paid` actuel).
- **Illimité (9,99€/mois)** : vrai **abonnement récurrent** — Stripe Checkout
  en mode `subscription`, qui redébite chaque mois jusqu'à résiliation. Il
  faudra gérer la résiliation (portail client Stripe ou webhook dédié) et le
  statut d'abonnement actif/inactif.

"Fiche unique" (3,99€, paiement unique) est déjà fonctionnel avec Stripe —
ne pas y toucher en implémentant les deux offres ci-dessus.

## Mentions légales

À compléter dans [app/mentions-legales/page.tsx](app/mentions-legales/page.tsx) :
- Nom et prénom de l'éditeur
- Statut juridique (entrepreneur individuel, auto-entrepreneur, particulier...)
- Adresse postale
- Numéro SIRET (le cas échéant)
- Email de contact
- Téléphone (optionnel)
- Nom, adresse et site web de l'hébergeur
