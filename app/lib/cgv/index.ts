import { createHash } from "node:crypto";
import { consentPlainText } from "../consent";
import { cgv20261006 } from "./versions/2026-10-06";
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
