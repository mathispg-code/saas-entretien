export type Categorie =
  | "technique"
  | "comportementale"
  | "situationnelle"
  | "motivation"
  | "culture";

export type Conseil = {
  objectif: string;
  conseil: string;
};

export type Question = {
  question: string;
  categorie: Categorie;
  conseil: Conseil;
  astuce: string;
};

export type QuestionAPoser = {
  question: string;
  pourquoi: string;
};

export type Analyse = {
  competencesCles: string[];
  responsabilitesPrincipales: string[];
  niveauSeniorite: string;
  signauxDistinctifs: string[];
};

export type CvVigilancePoint = {
  point: string;
  questionProbable: string;
  conseil: string;
};

export type FeedbackResult = {
  pointsForts: string[];
  pointsAAmeliorer: string[];
  structureStar?: { respectee: boolean; commentaire: string };
  suggestion: string;
};

export type AnswerState = {
  showBox: boolean;
  text: string;
  loading: boolean;
  result: FeedbackResult | null;
  error: string | null;
};

export const DEFAULT_ANSWER_STATE: AnswerState = {
  showBox: false,
  text: "",
  loading: false,
  result: null,
  error: null,
};

export const MAX_ANSWER_LENGTH = 2000;
export const FEEDBACK_TIMEOUT_MS = 45_000;
export const GENERIC_ERROR_MESSAGE = "Une erreur est survenue, réessaie dans quelques instants.";

export const CATEGORY_LABELS: Record<Categorie, string> = {
  technique: "Technique",
  comportementale: "Comportemental",
  situationnelle: "Mise en situation",
  motivation: "Motivation",
  culture: "Culture d'entreprise",
};

export const CATEGORY_STYLES: Record<Categorie, string> = {
  technique: "border-sky-200 bg-sky-50 text-sky-700",
  comportementale: "border-violet-200 bg-violet-50 text-violet-700",
  situationnelle: "border-amber-200 bg-amber-50 text-amber-700",
  motivation: "border-emerald-200 bg-emerald-50 text-emerald-700",
  culture: "border-rose-200 bg-rose-50 text-rose-700",
};
