import { createHash } from "node:crypto";
import { consentPlainText } from "../consent";
import { cgv20261006 } from "./versions/2026-10-06";
import { cgv20261007 } from "./versions/2026-10-07";
import type { CgvDocument, Inline } from "./types";

/**
 * Registre des versions des CGV. Chaque version publiee est FIGEE : son
 * contenu ne change jamais (une modification des CGV = un nouveau fichier dans
 * ./versions et une nouvelle entree ici). Son empreinte est epinglee ci-dessous
 * et verifiee avant chaque envoi de PDF : un achat est toujours accompagne des
 * CGV exactement telles qu'elles etaient au moment du paiement.
 *
 * REGLES :
 * - les entrees sont classees par date croissante ; la derniere est la version
 *   en vigueur (CGV_VERSION), celle qu'affiche /cgv et que Stripe enregistre
 *   pour les nouveaux achats ;
 * - ne jamais modifier ni supprimer une version deja utilisee pour un achat.
 */
export type CgvRegistryEntry = {
  version: string;
  document: CgvDocument;
  // SHA-256 du contenu canonique (voir canonicalCgvContent).
  contentHash: string;
};

export const CGV_REGISTRY: CgvRegistryEntry[] = [
  {
    version: "2026-10-06",
    document: cgv20261006,
    contentHash: "539ff30c3c38aab01b87dd0a98ae4cc6c8e778f05a8ee909c109f79410fc649e",
  },
  // Fiche unique + Pass hebdomadaire (Illimite retire), version propre : seul
  // marqueur restant [MÉDIATEUR À CHOISIR].
  {
    version: "2026-10-07",
    document: cgv20261007,
    contentHash: "543ed3656bdbb2e943f9f22cf723c103534cc4fb3f7c08ca03e83a8cdd404f64",
  },
];

/** Version en vigueur (derniere du registre) : enregistree avec chaque consentement. */
export const CGV_VERSION: string = CGV_REGISTRY[CGV_REGISTRY.length - 1].version;

export function getCgvEntry(version: string): CgvRegistryEntry | null {
  return CGV_REGISTRY.find((entry) => entry.version === version) ?? null;
}

const resolveInline = (inline: Inline) =>
  typeof inline === "object" && inline.t === "consent"
    ? { t: "consent", id: inline.id, text: consentPlainText(inline.id) }
    : inline;

/**
 * Serialisation canonique du contenu d'une version (libelles de consentement
 * inclus, resolus par identifiant) : base de l'empreinte epinglee.
 */
export function canonicalCgvContent(doc: CgvDocument): string {
  return JSON.stringify({
    version: doc.version,
    versionLabel: doc.versionLabel,
    title: doc.title,
    notice: doc.notice?.map(resolveInline),
    sections: doc.sections.map((section) => ({
      title: section.title,
      blocks: section.blocks.map((block) =>
        block.t === "p"
          ? { t: "p", c: block.c.map(resolveInline) }
          : block.t === "ul"
            ? { t: "ul", items: block.items.map((item) => item.map(resolveInline)) }
            : block,
      ),
    })),
  });
}

export function cgvContentHash(doc: CgvDocument): string {
  return createHash("sha256").update(canonicalCgvContent(doc)).digest("hex");
}

/** Vrai si le contenu de cette version est strictement celui qui a ete fige. */
export function isCgvEntryIntact(entry: CgvRegistryEntry): boolean {
  return entry.document.version === entry.version && cgvContentHash(entry.document) === entry.contentHash;
}

/**
 * Vrai si le document contient encore un marqueur de brouillon ([À COMPLÉTER],
 * [À FAIRE VALIDER], [MÉDIATEUR À CHOISIR]...). Sert de garde-fou : en mode
 * reel, aucun paiement n'est ouvert tant que les CGV en vigueur en contiennent.
 */
export function cgvDocumentHasDraftMarkers(doc: CgvDocument): boolean {
  const hasMark = (inlines: Inline[] | undefined) =>
    (inlines ?? []).some((inline) => typeof inline === "object" && inline.t === "mark");
  return (
    hasMark(doc.notice) ||
    doc.sections.some((section) =>
      section.blocks.some((block) =>
        block.t === "p" ? hasMark(block.c) : block.t === "ul" ? block.items.some(hasMark) : false,
      ),
    )
  );
}

export function cgvVersionHasDraftMarkers(version: string): boolean {
  const entry = getCgvEntry(version);
  // Version inconnue : par prudence, on la traite comme un brouillon.
  return entry ? cgvDocumentHasDraftMarkers(entry.document) : true;
}
