import type { ConsentTextId } from "../consent";

/**
 * Contenu des CGV sous forme de donnees : une meme source alimente la page
 * /cgv et le PDF joint a l'email de confirmation de commande. Chaque version
 * publiee est un fichier FIGE (voir app/lib/cgv/index.ts).
 */
export type MarkKind = "À COMPLÉTER" | "À FAIRE VALIDER";

export type Inline =
  | string
  | { t: "b"; text: string }
  | { t: "mail" }
  | { t: "link"; href: string; text: string }
  | { t: "mark"; kind: MarkKind; label: string }
  | { t: "br" }
  // Libelle de la case de consentement (texte brut), par identifiant de texte.
  | { t: "consent"; id: ConsentTextId };

export type Block =
  | { t: "h3"; text: string }
  | { t: "p"; c: Inline[] }
  | { t: "ul"; items: Inline[][] };

export type CgvSection = { title: string; blocks: Block[] };

export type CgvDocument = {
  // Identifiant de la version (date AAAA-MM-JJ) et son libelle affiche.
  version: string;
  versionLabel: string;
  title: string;
  // Bandeau affiche sous le titre tant que la version est un brouillon.
  notice?: Inline[];
  sections: CgvSection[];
};
