import type { Analyse, Question, QuestionAPoser } from "../types";

export async function downloadInterviewPdf({
  questions,
  questionsAPoser,
  analyse,
}: {
  questions: Question[];
  questionsAPoser: QuestionAPoser[];
  analyse: Analyse | null;
}) {
  const [{ pdf }, { InterviewPdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("../pdf/InterviewPdfDocument"),
  ]);

  const blob = await pdf(
    <InterviewPdfDocument
      questions={questions}
      questionsAPoser={questionsAPoser}
      analyse={analyse}
    />,
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "candiview-preparation-entretien.pdf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
