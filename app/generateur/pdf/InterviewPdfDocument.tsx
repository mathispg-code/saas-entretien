import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Analyse, Categorie, Niveau, Question, QuestionAPoser } from "../types";
import { CATEGORY_LABELS, NIVEAU_OPTIONS } from "../types";

const NAVY = "#0F2E4C";
const EMERALD = "#10B981";

const CATEGORY_COLORS: Record<Categorie, { bg: string; text: string }> = {
  technique: { bg: "#F0F9FF", text: "#0369A1" },
  comportementale: { bg: "#F5F3FF", text: "#6D28D9" },
  situationnelle: { bg: "#FFFBEB", text: "#B45309" },
  motivation: { bg: "#ECFDF5", text: "#047857" },
  culture: { bg: "#FFF1F2", text: "#BE123C" },
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#1e293b" },
  header: { backgroundColor: NAVY, padding: 18, borderRadius: 8, marginBottom: 20 },
  headerTitle: { color: "#ffffff", fontSize: 18, fontWeight: 700 },
  brand: { color: EMERALD },
  headerSubtitle: { color: "#cbd5e1", fontSize: 9, marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: NAVY, marginTop: 14, marginBottom: 8 },
  card: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
  },
  badge: {
    fontSize: 8,
    fontWeight: 700,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  questionText: { fontSize: 10.5, fontWeight: 700, marginBottom: 5 },
  row: { marginTop: 2.5, fontSize: 9, color: "#334155", lineHeight: 1.4 },
  rowLabel: { fontWeight: 700, color: "#047857" },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 32,
    right: 32,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
  },
});

export function InterviewPdfDocument({
  questions,
  questionsAPoser,
  niveau,
  analyse,
}: {
  questions: Question[];
  questionsAPoser: QuestionAPoser[];
  niveau: Niveau;
  analyse: Analyse | null;
}) {
  const niveauLabel = NIVEAU_OPTIONS.find((n) => n.value === niveau)?.label ?? niveau;

  return (
    <Document title="Préparation d'entretien - CandiView">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Candi<Text style={styles.brand}>View</Text> — Préparation d&apos;entretien
          </Text>
          <Text style={styles.headerSubtitle}>
            {questions.length} questions · Niveau {niveauLabel}
            {analyse ? ` · ${analyse.niveauSeniorite}` : ""}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Questions d&apos;entretien</Text>
        {questions.map((q, i) => (
          <View key={i} style={styles.card} wrap={false}>
            <Text
              style={[
                styles.badge,
                {
                  backgroundColor: CATEGORY_COLORS[q.categorie].bg,
                  color: CATEGORY_COLORS[q.categorie].text,
                },
              ]}
            >
              {CATEGORY_LABELS[q.categorie]}
            </Text>
            <Text style={styles.questionText}>
              {i + 1}. {q.question}
            </Text>
            <Text style={styles.row}>
              <Text style={styles.rowLabel}>Ce que ça évalue : </Text>
              {q.conseil.objectif}
            </Text>
            <Text style={styles.row}>
              <Text style={styles.rowLabel}>Conseil : </Text>
              {q.conseil.conseil}
            </Text>
            <Text style={styles.row}>
              <Text style={styles.rowLabel}>Astuce : </Text>
              {q.astuce}
            </Text>
          </View>
        ))}

        {questionsAPoser.length > 0 && (
          <>
            <Text style={styles.sectionTitle} break>
              Questions à poser au recruteur
            </Text>
            {questionsAPoser.map((item, i) => (
              <View key={i} style={styles.card} wrap={false}>
                <Text style={styles.questionText}>
                  {i + 1}. {item.question}
                </Text>
                <Text style={styles.row}>
                  <Text style={styles.rowLabel}>Pourquoi la poser : </Text>
                  {item.pourquoi}
                </Text>
              </View>
            ))}
          </>
        )}

        <Text style={styles.footer} fixed>
          Généré avec CandiView — candiview.fr
        </Text>
      </Page>
    </Document>
  );
}
