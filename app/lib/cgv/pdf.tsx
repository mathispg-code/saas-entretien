import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { consentPlainText } from "../consent";
import { CANONICAL_ORIGIN } from "../site";
import type { Block, CgvDocument, Inline } from "./types";

/**
 * PDF des CGV d'une version donnee, joint a l'email de confirmation de
 * commande (support durable). Fonction PURE du contenu de la version :
 * aucune donnee propre a l'achat, et metadonnees (dates, createur) fixees a
 * partir de la version, pour que le PDF d'une version soit toujours
 * strictement identique (meme octets) quel que soit le moment du rendu.
 * Serveur uniquement.
 */
const CONTACT_EMAIL = "contact@candiview.fr";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 50,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.45,
    color: "#0f172a",
  },
  brand: { fontFamily: "Helvetica-Bold", fontSize: 14, marginBottom: 14 },
  title: { fontFamily: "Helvetica-Bold", fontSize: 18, marginBottom: 4 },
  version: { fontSize: 10, color: "#475569", marginBottom: 6 },
  notice: { fontSize: 9, color: "#92400e", marginBottom: 6 },
  sectionTitle: { fontFamily: "Helvetica-Bold", fontSize: 11.5, marginTop: 14, marginBottom: 3 },
  subTitle: { fontFamily: "Helvetica-Bold", fontSize: 10.5, marginTop: 8, marginBottom: 2 },
  paragraph: { marginTop: 4 },
  bold: { fontFamily: "Helvetica-Bold" },
  listItem: { flexDirection: "row", marginTop: 2, paddingLeft: 8 },
  bullet: { width: 10 },
  listText: { flex: 1 },
  footer: {
    position: "absolute",
    bottom: 26,
    left: 50,
    right: 50,
    fontSize: 8,
    color: "#64748b",
    textAlign: "center",
  },
});

function renderInline(inline: Inline, key: number): ReactNode {
  if (typeof inline === "string") return inline;
  switch (inline.t) {
    case "b":
      return (
        <Text key={key} style={styles.bold}>
          {inline.text}
        </Text>
      );
    case "mail":
      return CONTACT_EMAIL;
    case "link":
      // Dans un PDF, l'adresse complete reste lisible meme imprimee.
      return `${inline.text} (${CANONICAL_ORIGIN}${inline.href})`;
    case "mark":
      return `[${inline.kind} : ${inline.label}]`;
    case "br":
      return "\n";
    case "consent":
      return consentPlainText(inline.id);
  }
}

function Inlines({ items }: { items: Inline[] }) {
  return <>{items.map((inline, i) => renderInline(inline, i))}</>;
}

function BlockView({ block }: { block: Block }) {
  switch (block.t) {
    case "h3":
      return <Text style={styles.subTitle}>{block.text}</Text>;
    case "p":
      return (
        <Text style={styles.paragraph}>
          <Inlines items={block.c} />
        </Text>
      );
    case "ul":
      return (
        <View>
          {block.items.map((item, i) => (
            <View key={i} style={styles.listItem} wrap={false}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                <Inlines items={item} />
              </Text>
            </View>
          ))}
        </View>
      );
  }
}

export async function renderCgvPdf(doc: CgvDocument): Promise<Buffer> {
  // Midi UTC du jour de la version : valeur fixe, derivee de la version.
  const fixedDate = new Date(`${doc.version}T12:00:00.000Z`);
  const footerLabel = `CGV CandiView — version du ${doc.versionLabel}`;

  return renderToBuffer(
    <Document
      title={`${doc.title} — CandiView (version du ${doc.versionLabel})`}
      author="CandiView"
      subject={`CGV, version ${doc.version}`}
      creator="CandiView"
      producer="CandiView"
      creationDate={fixedDate}
      modificationDate={fixedDate}
    >
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.brand}>CandiView</Text>
          <Text style={styles.title}>{doc.title}</Text>
          <Text style={styles.version}>Version du {doc.versionLabel}</Text>
          {doc.notice && (
            <Text style={styles.notice}>
              <Inlines items={doc.notice} />
            </Text>
          )}
        </View>

        {doc.sections.map((section) => (
          <View key={section.title}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.blocks.map((block, i) => (
              <BlockView key={i} block={block} />
            ))}
          </View>
        ))}

        <Text
          fixed
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `${footerLabel} — page ${pageNumber}/${totalPages}`}
        />
      </Page>
    </Document>,
  );
}
