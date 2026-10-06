# TODO avant mise en ligne définitive

Valeurs provisoires utilisées dans le code, à remplacer une fois les
informations définitives connues.

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

## Offres simulées encore visibles (à décider)

`/tarifs` ne montre plus que la Fiche unique (drapeau `SHOW_SIMULATED_PLANS = false`
dans [app/tarifs/page.tsx](app/tarifs/page.tsx), le code des deux autres plans est
conservé). **Mais deux autres endroits affichent encore Pass hebdo / Illimité** :
- la modale [UnlockModal.tsx](app/generateur/components/UnlockModal.tsx) (3 offres, boutons simulés) ;
- le bloc "Tu as testé gratuitement CandiView" de [app/generateur/page.tsx](app/generateur/page.tsx)
  (ligne "Illimité 9,99 € / mois").
À masquer de la même façon tant que Stripe n'est pas branché sur ces offres et que les
CGV ne les couvrent pas.

## CGV

Page [app/cgv/page.tsx](app/cgv/page.tsx) en place. À faire :
- **Médiation de la consommation : article retiré pour l'instant** (l'ancien article 12, supprimé
  le 6 octobre 2026 ; les articles suivants ont été renumérotés). À remettre avant l'ouverture
  aux clients : un professionnel qui vend à des consommateurs doit en principe leur garantir
  l'accès à un médiateur (à faire confirmer). Il faut choisir un médiateur, puis réintroduire
  l'article avec son nom, son site web et son adresse postale, et le droit de le saisir
  gratuitement après démarche écrite préalable auprès de l'éditeur.
- Les CGV ne couvrent que le pack à 3,99 € : les offres Pass hebdo et Illimité devront y
  être ajoutées avant leur vrai branchement Stripe.
- Faire relire la clause de rétractation (art. 6) par un juriste.

## Enregistrer l'acceptation des CGV côté serveur

Aujourd'hui la case CGV n'est qu'une protection d'interface : rien n'est enregistré et le
serveur ne vérifie rien. Pistes à décider (détail dans la discussion du 6 octobre 2026) :
- `consent_collection[terms_of_service]=required` + `custom_text[terms_of_service_acceptance]`
  sur la session Checkout (consentement enregistré par Stripe : `consent.terms_of_service`) ;
  nécessite l'URL des CGV dans les informations publiques du compte Stripe.
- `metadata` de la session (version et date des CGV) + refus de `/api/checkout` si le client
  n'envoie pas l'acceptation.

## Stripe : configuration du compte et reçus

- Informations publiques du compte (test **et** live) : l'email de support est vide ; renseigner
  email de support, adresse, URL de la politique de confidentialité et URL des CGV, et un nom
  d'entreprise correct (le nom actuel est "environnement de test CandiView").
- Dashboard > Paramètres > Entreprise > E-mails aux clients : activer "Paiements réussis" (en
  mode **live** ; en test, Stripe n'envoie rien automatiquement, seulement des reçus manuels).
- Décider comment envoyer une vraie confirmation de contrat (CGV + renonciation à la
  rétractation) : le reçu Stripe n'en tient pas lieu à lui seul. À faire valider par un juriste.

## Politique de confidentialité

Page réécrite d'après le code réel ([app/confidentialite/page.tsx](app/confidentialite/page.tsx)).
Marqueurs jaunes à lever :
- `[À COMPLÉTER : durée à décider]` : durée de conservation des générations en base.
- `[À VÉRIFIER]` : base légale de la mesure d'audience (Vercel Analytics) ; région du projet
  Supabase ; région d'exécution des fonctions Vercel ; localisation du traitement et garanties
  de transfert hors UE pour Anthropic, Supabase, Vercel et Stripe ; conditions de rétention
  et d'usage des données par Anthropic pour l'API.

## Suppression automatique des anciennes générations (non implémentée)

Une fois la durée de conservation décidée, supprimer automatiquement les lignes anciennes de
la table `generations` (Supabase). À noter : le rôle `service_role` n'a pas le droit DELETE
sur cette table (voir [supabase/schema.sql](supabase/schema.sql)), il faudra l'accorder ou
passer par une fonction/cron côté Supabase.

## Mentions légales

Page entièrement renseignée dans [app/mentions-legales/page.tsx](app/mentions-legales/page.tsx)
(éditeur, SIREN/SIRET, RCS, adresse, TVA, hébergeur Vercel, domaine IONOS, contact).
- À vérifier : un numéro de téléphone est en principe exigé pour un entrepreneur
  individuel (LCEN, art. 6) — non renseigné pour l'instant
