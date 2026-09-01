# TODO avant mise en ligne définitive

Valeurs provisoires utilisées dans le code, à remplacer une fois les
informations définitives connues.

## Nom du site / marque

Actuellement : **"EntretienIA"**. À remplacer partout si le nom change :
- [app/page.tsx](app/page.tsx) — header ("EntretienIA"), footer
- [app/layout.tsx](app/layout.tsx) — titre de la page, Open Graph, Twitter Card
- [app/opengraph-image.tsx](app/opengraph-image.tsx) — image de partage
- [app/mentions-legales/page.tsx](app/mentions-legales/page.tsx) — header
- [app/confidentialite/page.tsx](app/confidentialite/page.tsx) — header

## Adresse email de feedback

Actuellement : `ton-email@exemple.com` (lien "Un bug ? Une suggestion ?" dans le footer).
À remplacer dans [app/page.tsx](app/page.tsx).

## Mentions légales

À compléter dans [app/mentions-legales/page.tsx](app/mentions-legales/page.tsx) :
- Nom et prénom de l'éditeur
- Statut juridique (entrepreneur individuel, auto-entrepreneur, particulier...)
- Adresse postale
- Numéro SIRET (le cas échéant)
- Email de contact
- Téléphone (optionnel)
- Nom, adresse et site web de l'hébergeur

## Nom de domaine

Une fois le nom de domaine acheté :
- Ajouter `metadataBase` dans [app/layout.tsx](app/layout.tsx) (nécessaire pour que les URLs Open Graph/Twitter soient absolues)
- Éventuellement ajouter l'URL du site dans les métadonnées Open Graph

## SEO à retravailler une fois le nom définitif choisi

- Titre de la page et balise `<title>`
- Meta description
- Mots-clés / positionnement (actuellement centré sur "génération de questions d'entretien par IA")
- Image Open Graph (actuellement générée en code dans [app/opengraph-image.tsx](app/opengraph-image.tsx) — à retravailler avec le design final si besoin)
