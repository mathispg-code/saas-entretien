# TODO avant mise en ligne définitive

## Ouverture des paiements : Fiche unique + Pass hebdomadaire uniquement

L'abonnement **Illimité est retiré de l'offre** : masqué sur `/tarifs`, dans la modale et dans le bloc
du générateur, **et refusé côté serveur** (`/api/checkout` répond 400 « offre plus disponible »).
Toute sa logique reste en place (checkout en mode abonnement, webhook, portail, email, accès) :
drapeau `OFFERS_ENABLED.mensuel` dans [app/lib/offers.ts](app/lib/offers.ts) (voir « Réactiver
Illimité » plus bas).

CGV en vigueur : version figée **`2026-10-07`** ([app/lib/cgv/versions/2026-10-07.ts](app/lib/cgv/versions/2026-10-07.ts)),
version propre (clauses standard pour la vente de contenu numérique à des particuliers).
Case Stripe : texte `ponctuel-v2` ([app/lib/consent.ts](app/lib/consent.ts)). Email de confirmation :
modèle `confirmation-contrat-v2` ([app/lib/contract-email.ts](app/lib/contract-email.ts)).

### Marqueurs restants (à lever avant d'encaisser pour de vrai)
- **`[MÉDIATEUR À CHOISIR]`** — seul marqueur des CGV, dans
  [app/lib/cgv/versions/2026-10-07.ts](app/lib/cgv/versions/2026-10-07.ts) (article 16) ; même marqueur
  dans l'email de confirmation, [app/lib/contract-email.ts](app/lib/contract-email.ts) (bloc « Médiation »).
  Choisir un médiateur de la consommation, puis **publier une nouvelle version des CGV** (nouveau fichier
  de version daté, nouvelle entrée en dernière position de [app/lib/cgv/index.ts](app/lib/cgv/index.ts),
  sans jamais modifier `2026-10-07`) et remplacer le marqueur dans l'email (nouveau modèle).
- **Garde-fous automatiques** : tant qu'un marqueur existe dans les CGV en vigueur, `/api/checkout` refuse
  tout paiement en **mode réel** (clé `sk_live_`, réponse 503) ; en mode réel, l'email de confirmation
  n'est jamais envoyé s'il contient un marqueur (statut `failed_permanent` / `draft_markers`). Les paiements
  en mode test ne sont pas concernés.
- Politique de confidentialité ([app/confidentialite/page.tsx](app/confidentialite/page.tsx)) : voir la section
  dédiée plus bas (durées de conservation, localisations, bases légales à confirmer).

### Points de vigilance (budget 0 € : pas de relecture par un juriste)
- Les CGV et l'email sont rédigés à partir de clauses standard, **sans relecture juridique** : ce n'est pas
  un avis juridique. Dès que possible, faire relire au moins l'article 8 (rétractation : Fiche unique =
  contenu numérique art. L221-28 13°, Pass hebdomadaire = service pleinement exécuté art. L221-28 1°, avec
  repli sur le paiement proportionnel art. L221-25), l'article 11 (responsabilité) et le texte de la case.
- **Modèle de formulaire de rétractation** (annexe des CGV) : transcrit de mémoire du modèle officiel
  (annexe à l'article R221-1 du Code de la consommation) : à comparer avec le texte officiel sur Légifrance.
- Citations d'articles du Code de la consommation utilisées : L221-18, L221-25, L221-28 (1° et 13°), L612-1.

## Pass hebdomadaire : accès par cookie (code en place) — à finir avant le live

Fonctionnement : cookie d'accès `candiview_access` (jeton aléatoire, seul son hash est en base, table
`access`), vérification côté serveur dans [/api/generate](app/api/generate/route.ts), webhook, plafond
quotidien (10 générations / 24 h glissantes, variable `ACCESS_DAILY_GENERATION_LIMIT`, non affiché).
Récupération par email : page [/mon-acces](app/mon-acces/page.tsx), lien magique à usage unique valable
15 minutes, un seul appareil à la fois. "Fiche unique" (3,99 €) : pack lié à une génération.

À faire côté Supabase / Vercel / Stripe :
- **SQL déjà exécutés en test** : [access.sql](supabase/access.sql), [access-recovery.sql](supabase/access-recovery.sql),
  [consents.sql](supabase/consents.sql), [contract-confirmations.sql](supabase/contract-confirmations.sql)
  (vérifier qu'ils sont aussi exécutés sur le projet Supabase de production s'il est distinct).
- **Variables Vercel** : `STRIPE_PRICE_ID_UNIQUE` (même valeur que l'ancienne `STRIPE_PRICE_ID`, qui reste
  acceptée en repli), `STRIPE_PRICE_ID_HEBDO`, `SITE_URL=https://www.candiview.fr`, `CRON_SECRET`,
  `RESEND_API_KEY`, éventuellement `EMAIL_FROM`, `ACCESS_DAILY_GENERATION_LIMIT`, `RECOVERY_IP_HOURLY_LIMIT`,
  `RECOVERY_GLOBAL_DAILY_LIMIT`. `STRIPE_PRICE_ID_MENSUEL` n'est pas nécessaire tant qu'Illimité est retiré.
- **Webhook Stripe** (endpoint `https://www.candiview.fr/api/webhooks/stripe`) : `checkout.session.completed`
  suffit tant qu'Illimité est retiré (les événements d'abonnement ne sont utiles qu'à sa réactivation).
- **Resend** : domaine `send.candiview.fr` vérifié (région UE), clé API limitée à l'envoi, DMARC conseillé
  (`_dmarc`, `p=none` pour commencer). Tester un vrai envoi et le parcours mobile (appli Gmail).
  Quota partagé : plafond global des emails de récupération à **50 par jour** (`RECOVERY_GLOBAL_DAILY_LIMIT`)
  pour ne jamais retarder les confirmations de commande ; plan gratuit Resend = 100 emails par jour
  (à vérifier), passer à un plan payant avant un volume réel.
- Les générations créées avec un pass restent débloquées (feedback, CV, PDF) après son expiration, comme un
  pack Fiche unique.

## Stripe : configuration du compte (test, puis live)

- **Nom du compte** : il s'affiche aux clients dans la case de consentement et dans le message d'erreur
  (« environnement de test CandiView ») : le renommer en « CandiView ».
- **Informations publiques** : email de support (vide aujourd'hui), adresse, URL de la politique de
  confidentialité et URL des CGV (`https://www.candiview.fr/cgv`).
- **Moyens de paiement : carte uniquement** (Dashboard > Moyens de paiement, à refaire en mode **live**, les
  réglages sont séparés par mode). Le webhook ne gère que `checkout.session.completed` : un moyen de paiement
  à confirmation différée (virement, prélèvement) ne serait pas livré correctement. Ne pas activer d'autre
  moyen de paiement sans implémenter `async_payment_succeeded`.
- Dashboard > Paramètres > Entreprise > E-mails aux clients : activer « Paiements réussis » (mode live ;
  en test, Stripe n'envoie rien automatiquement). L'email de confirmation du contrat est envoyé par
  CandiView (Resend) et ne remplace pas ce reçu.
- Passage en **live** : recréer les prix Fiche unique et Pass hebdomadaire (et le webhook) en mode live, avec
  de nouvelles clés.

## Consentement et preuves (code en place)

Case unique affichée par Stripe Checkout (texte personnalisé et lien vers les CGV testés sur la vraie page,
paiement refusé tant que la case n'est pas cochée). Le webhook enregistre la preuve dans `consents`
(heure du paiement, version des CGV, texte exact, offre, session, email) puis envoie l'email de confirmation
une seule fois par session (`contract_confirmations`, clé d'idempotence Resend), avec le PDF des CGV **de la
version de l'achat** en pièce jointe. Pas de droit UPDATE/DELETE sur `consents` pour `service_role`
(volontaire) ; `contract_confirmations` : SELECT, INSERT, UPDATE seulement.
- Tout changement de texte de la case = nouvel identifiant dans [app/lib/consent.ts](app/lib/consent.ts) (les
  anciens ne changent jamais) ; toute modification des CGV = nouvelle version figée (voir plus haut).
- **Durées de conservation à décider** : `consents`, `contract_confirmations` (statut d'envoi, texte envoyé,
  empreinte du PDF), à inscrire dans la politique de confidentialité.
- Lignes de test dans `access`, `consents`, `contract_confirmations`, `generations` : à supprimer depuis le
  SQL Editor (aucun DELETE accordé à l'application).

## Réactiver Illimité (abonnement) — pas avant d'avoir fait tout ceci
1. Passer `OFFERS_ENABLED.mensuel` à `true` dans [app/lib/offers.ts](app/lib/offers.ts).
2. Publier une nouvelle version des CGV qui reprend les clauses d'abonnement (renouvellement tacite,
   résiliation en ligne en un clic, échec de paiement, rétractation d'un abonnement) : voir la version figée
   `2026-10-06` ([app/lib/cgv/versions/2026-10-06.ts](app/lib/cgv/versions/2026-10-06.ts)).
3. Revalider la case de consentement `abonnement-v1` ([app/lib/consent.ts](app/lib/consent.ts)) et le contenu de
   l'email de confirmation pour l'abonnement.
4. **Emails obligatoires à concevoir et faire valider** : confirmation de résiliation (au moment de la
   résiliation en ligne) et rappel avant renouvellement tacite (nécessite un envoi planifié ; le cron Vercel
   gratuit n'autorise qu'une exécution par jour).
5. Stripe : `STRIPE_PRICE_ID_MENSUEL` en live, événements `customer.subscription.updated`,
   `customer.subscription.deleted` et `invoice.payment_failed` sur l'endpoint du webhook, configuration du
   Customer Portal en mode live (résiliation en fin de période, carte, factures), relances de paiement
   (Smart Retries) et statut final (`canceled` ou `unpaid`) pour que l'accès soit coupé à la fin des relances.
6. Mettre à jour la politique de confidentialité (abonnement, portail, renouvellement).

## Politique de confidentialité

Page à jour pour Fiche unique + Pass hebdomadaire (cookie d'accès, email, preuve du consentement, email de
confirmation, Resend), version du 7 octobre 2026 ([app/confidentialite/page.tsx](app/confidentialite/page.tsx)).
Marqueurs jaunes restants, à lever :
- `[À COMPLÉTER : durée à décider]` : durée de conservation des générations en base.
- `[À COMPLÉTER]` : durée de conservation des données d'accès (email, statut, identifiants Stripe) après la
  fin de l'accès ; de la preuve du consentement ; de la confirmation de commande.
- `[À VÉRIFIER]` : base légale de la mesure d'audience (Vercel Analytics) ; région du projet Supabase ; région
  d'exécution des fonctions Vercel ; localisation du traitement et garanties de transfert hors UE pour
  Anthropic, Supabase, Vercel, Stripe et Resend ; conditions de rétention et d'usage des données par
  Anthropic pour l'API.

## Suppression automatique des anciennes données (non implémentée)

Une fois les durées de conservation décidées, supprimer automatiquement les lignes anciennes de
`generations`, `access`, `consents` et `contract_confirmations`. Le rôle `service_role` n'a le droit DELETE
sur aucune d'elles (voir [supabase/schema.sql](supabase/schema.sql)) : il faudra l'accorder ou passer par
une fonction/cron côté Supabase.

## Mentions légales

Page entièrement renseignée dans [app/mentions-legales/page.tsx](app/mentions-legales/page.tsx)
(éditeur, SIREN/SIRET, RCS, adresse, TVA, hébergeur Vercel, domaine IONOS, contact).
- À vérifier : un numéro de téléphone est en principe exigé pour un entrepreneur
  individuel (LCEN, art. 6) — non renseigné pour l'instant
