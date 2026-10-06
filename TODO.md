# TODO avant mise en ligne définitive

Valeurs provisoires utilisées dans le code, à remplacer une fois les
informations définitives connues.

## Pass hebdo et Illimité : branchés à Stripe (mode test) — à finir avant le live

Fonctionnement (code en place) : cookie d'accès `candiview_access` (jeton aléatoire, seul son
hash est en base, table `access`), vérification côté serveur dans
[/api/generate](app/api/generate/route.ts), webhook, Customer Portal, plafond quotidien
(10 générations / 24 h glissantes, variable `ACCESS_DAILY_GENERATION_LIMIT`, non affiché).
"Fiche unique" (3,99 €) est inchangée.

À faire côté Supabase / Vercel / Stripe :
- **Exécuter [supabase/access.sql](supabase/access.sql)** dans le SQL Editor (table `access`
  avec RLS, aucun droit pour anon/authenticated, service_role seulement ; colonne
  `generations.access_id`) puis lancer les 2 requêtes de vérification en bas du fichier.
- **Variables Vercel** : `STRIPE_PRICE_ID_UNIQUE` (même valeur que l'ancienne
  `STRIPE_PRICE_ID`, qui reste acceptée en repli), `STRIPE_PRICE_ID_HEBDO`,
  `STRIPE_PRICE_ID_MENSUEL`, `SITE_URL=https://www.candiview.fr`, `CRON_SECRET`, et
  éventuellement `ACCESS_DAILY_GENERATION_LIMIT`. Les prix de test existent (produits
  "CandiView — Pass hebdomadaire" 6,99 € et "CandiView — Illimité" 9,99 €/mois, créés par API).
- **Webhook Stripe** (Dashboard > Développeurs > Webhooks, endpoint
  `https://www.candiview.fr/api/webhooks/stripe`) : ajouter les événements
  `customer.subscription.updated`, `customer.subscription.deleted` et `invoice.payment_failed`
  (seul `checkout.session.completed` est écouté aujourd'hui).
- **Customer Portal** : une configuration de test a été créée par API (résiliation en fin de
  période, mise à jour de la carte, factures). À refaire en mode **live**. Option sans code :
  activer la page de connexion du portail (lien par email) pour résilier depuis un autre appareil.
- **Récupération d'accès par email** : code en place (page [/mon-acces](app/mon-acces/page.tsx),
  lien magique à usage unique valable 15 minutes, jeton dans le fragment de l'URL, rotation du
  cookie = un seul appareil à la fois, limites anti-abus). Reste à faire avant le live :
  exécuter [supabase/access-recovery.sql](supabase/access-recovery.sql) (fait en test),
  configurer **Resend** (domaine `send.candiview.fr` en région UE, clé API limitée à l'envoi) et
  les enregistrements DNS chez IONOS, puis créer les variables Vercel `RESEND_API_KEY` (et
  éventuellement `EMAIL_FROM`, `RECOVERY_IP_HOURLY_LIMIT`, `RECOVERY_GLOBAL_DAILY_LIMIT`).
  Tester un vrai envoi (délivrabilité Gmail/Outlook) et le parcours mobile (appli Gmail).
  Ajouter un enregistrement DMARC (`_dmarc`, `p=none` pour commencer).
- Décision à confirmer : coupure immédiate dès que Stripe passe l'abonnement en `canceled`/
  `unpaid` ; l'accès est conservé en `past_due` (relances Stripe) avec un message "mets à jour
  ta carte via Gérer mon abonnement".
- Les générations créées avec un pass restent débloquées (feedback, CV, PDF) après son
  expiration, comme un pack Fiche unique.
- Réglage Stripe (live) à vérifier : relances de paiement (Smart Retries) et statut final
  (`canceled` ou `unpaid`) pour que l'accès soit bien coupé à la fin des relances.

## CGV : brouillon à faire relire avant tout passage en live

Page [app/cgv/page.tsx](app/cgv/page.tsx) : version **brouillon** incluant Pass hebdomadaire,
abonnement Illimité, durée/renouvellement/résiliation, usage raisonnable, accès par cookie et
case de renonciation. Les passages `[À COMPLÉTER]` / `[À FAIRE VALIDER]` sont visibles sur la
page : **ne pas déployer en production sans les avoir traités**.
- Règle de remboursement d'un mois entamé, et information avant chaque reconduction tacite.
- Obligations légales de reconduction tacite et de résiliation en ligne.
- Case de renonciation à la rétractation pour Pass hebdo / abonnement : libellé et clause à
  faire valider par un juriste (la perte du droit de rétractation d'un abonnement mensuel
  n'est pas celle d'un pack ponctuel). Faire aussi relire l'article 8 (rétractation).
- Procédure de récupération de l'accès par email, conséquences d'un abus d'usage.
- **Médiation de la consommation : article retiré pour l'instant** (supprimé le 6 octobre
  2026). À remettre avant l'ouverture aux clients : un professionnel qui vend à des
  consommateurs doit en principe leur garantir l'accès à un médiateur (à faire confirmer). Il
  faut choisir un médiateur, puis réintroduire l'article avec son nom, son site web et son
  adresse postale, et le droit de le saisir gratuitement après démarche écrite préalable.
- Date de mise en vigueur de la nouvelle version.

## Consentement CGV / renonciation à la rétractation (code en place, à valider)

Case unique affichée par **Stripe Checkout** sur la page de paiement (testé sur la vraie page : texte
personnalisé et lien vers les CGV affichés, paiement refusé tant que la case n'est pas cochée), deux
textes (voir [app/lib/consent.ts](app/lib/consent.ts), source unique aussi reprise dans les CGV).
Le webhook enregistre la preuve dans la table `consents` ([supabase/consents.sql](supabase/consents.sql)) :
heure du paiement, version des CGV, texte exact, offre, session Stripe, email. Pas de droit UPDATE/DELETE
pour `service_role` sur cette table, volontairement.
- **Dashboard Stripe (test, puis live)** : le nom du compte s'affiche aux clients dans la case et dans
  le message d'erreur (« environnement de test CandiView ») : le renommer en « CandiView » ; renseigner
  l'URL des CGV (`https://www.candiview.fr/cgv`) dans les informations publiques ; email de support.
- Faire valider les deux textes par un juriste (la perte du droit de rétractation d'un abonnement
  mensuel n'est pas celle d'un pack ponctuel). Tout changement de texte = nouvel identifiant dans
  `consent.ts` et nouvelle valeur de `CGV_VERSION` si les CGV changent.
- **BLOQUANT AVANT LE LIVE : email de confirmation du contrat** (support durable) envoyé via Resend
  après le paiement : offre, prix, date, version des CGV, rappel de la case acceptée et de la
  renonciation, lien vers les CGV, information sur le droit de rétractation. Le reçu Stripe n'en
  tient pas lieu. À faire valider par un juriste.
- **Moyens de paiement** : la page Stripe propose aussi Klarna, Bancontact, Amazon Pay, Satispay, etc.
  (réglage du Dashboard). Le webhook ne gère que `checkout.session.completed` : un moyen de paiement
  à confirmation différée (virement, prélèvement) ne serait pas livré correctement (Pass hebdo ignoré si
  non payé, Fiche unique marquée payée sans vérifier `payment_status`). Décider : limiter à la carte
  (Dashboard > Moyens de paiement, ou `payment_method_types`) ou gérer `async_payment_succeeded`.
- Durée de conservation de la table `consents` (preuve) : à décider (`[À COMPLÉTER]` dans la
  politique de confidentialité).
- Lignes de test dans `consents` : à supprimer depuis le SQL Editor (aucun DELETE accordé à l'application).

## Stripe : configuration du compte et reçus

- Informations publiques du compte (test **et** live) : l'email de support est vide ; renseigner
  email de support, adresse, URL de la politique de confidentialité et URL des CGV, et un nom
  d'entreprise correct (le nom actuel est "environnement de test CandiView").
- Dashboard > Paramètres > Entreprise > E-mails aux clients : activer "Paiements réussis" (en
  mode **live** ; en test, Stripe n'envoie rien automatiquement, seulement des reçus manuels).
- Décider comment envoyer une vraie confirmation de contrat (CGV + renonciation à la
  rétractation) : le reçu Stripe n'en tient pas lieu à lui seul. À faire valider par un juriste.
- Passage en **live** : recréer les 3 prix, le webhook (avec les 4 événements) et la
  configuration du Customer Portal en mode live, avec de nouvelles clés.

## Politique de confidentialité

Page à jour avec le cookie d'accès, l'email et les données d'accès Pass/Illimité
([app/confidentialite/page.tsx](app/confidentialite/page.tsx)). Marqueurs jaunes à lever :
- `[À COMPLÉTER : durée à décider]` : durée de conservation des générations en base.
- `[À COMPLÉTER]` : durée de conservation des données d'accès (email, statut, identifiants
  Stripe) après la fin de l'accès.
- `[À VÉRIFIER]` : localisation du traitement et garanties de transfert hors UE pour Resend
  (nouveau sous-traitant, envoi des emails de récupération).
- `[À VÉRIFIER]` : base légale de la mesure d'audience (Vercel Analytics) ; région du projet
  Supabase ; région d'exécution des fonctions Vercel ; localisation du traitement et garanties
  de transfert hors UE pour Anthropic, Supabase, Vercel et Stripe ; conditions de rétention
  et d'usage des données par Anthropic pour l'API.

## Suppression automatique des anciennes générations (non implémentée)

Une fois la durée de conservation décidée, supprimer automatiquement les lignes anciennes de
la table `generations` (Supabase). À noter : le rôle `service_role` n'a pas le droit DELETE
sur cette table (voir [supabase/schema.sql](supabase/schema.sql)), il faudra l'accorder ou
passer par une fonction/cron côté Supabase. Même question pour la table `access` (aucun
DELETE accordé non plus).

## Mentions légales

Page entièrement renseignée dans [app/mentions-legales/page.tsx](app/mentions-legales/page.tsx)
(éditeur, SIREN/SIRET, RCS, adresse, TVA, hébergeur Vercel, domaine IONOS, contact).
- À vérifier : un numéro de téléphone est en principe exigé pour un entrepreneur
  individuel (LCEN, art. 6) — non renseigné pour l'instant
