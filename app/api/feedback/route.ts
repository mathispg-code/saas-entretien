import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { GENERIC_ERROR_MESSAGE, json, optionsResponse } from "../../lib/api-response";

export const runtime = "nodejs";

const MAX_QUESTION_LENGTH = 1000;
const MAX_ANSWER_LENGTH = 2000;

const FEEDBACK_CATEGORIES = [
  "technique",
  "comportementale",
  "situationnelle",
  "motivation",
  "culture",
] as const;

type FeedbackCategorie = (typeof FEEDBACK_CATEGORIES)[number];

const STAR_CATEGORIES: FeedbackCategorie[] = ["comportementale", "situationnelle"];

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

function buildFeedbackSchema(includeStar: boolean) {
  return z.object({
    pointsForts: z.array(z.string()),
    pointsAAmeliorer: z.array(z.string()),
    ...(includeStar
      ? {
          structureStar: z.object({
            respectee: z.boolean(),
            commentaire: z.string(),
          }),
        }
      : {}),
    suggestion: z.string(),
  });
}

function buildSystemPrompt(categorie: FeedbackCategorie, includeStar: boolean) {
  return `Tu es un recruteur senior avec 15 ans d'expérience en entretiens d'embauche.
On te fournit une question d'entretien (catégorie : ${categorie}), le contexte du poste visé, et la réponse rédigée par un candidat à cette question.
Évalue cette réponse comme si tu venais de l'entendre en entretien.

Donne :
- pointsForts : 2 à 3 points forts courts et concrets de la réponse (une phrase chacun)
- pointsAAmeliorer : 1 à 3 points à améliorer, courts et actionnables (une phrase chacun)
${includeStar ? "- structureStar : évalue si la réponse suit la méthode STAR (Situation, Tâche, Action, Résultat) — respectee (true/false) et un commentaire d'une phrase expliquant ce qui est respecté ou ce qui manque" : ""}
- suggestion : une reformulation ou un ajout concret que le candidat pourrait utiliser pour améliorer sa réponse, en 1 à 2 phrases courtes

Reste bienveillant mais honnête, concret et actionnable — jamais vague ni flatteur sans fondement. Si la réponse est hors sujet, trop courte ou vide de contenu pour être évaluée sérieusement, dis-le clairement dans pointsAAmeliorer plutôt que d'inventer des points forts.
Réponds en français.`;
}

type JobContext = {
  competencesCles?: string[];
  responsabilitesPrincipales?: string[];
  niveauSeniorite?: string;
  signauxDistinctifs?: string[];
};

function formatJobContext(jobContext: JobContext | undefined): string {
  if (!jobContext) {
    return "Aucun contexte de poste disponible.";
  }
  const lines: string[] = [];
  if (jobContext.niveauSeniorite) {
    lines.push(`Niveau de séniorité attendu : ${jobContext.niveauSeniorite}`);
  }
  if (jobContext.competencesCles?.length) {
    lines.push(`Compétences clés recherchées : ${jobContext.competencesCles.join(", ")}`);
  }
  if (jobContext.responsabilitesPrincipales?.length) {
    lines.push(`Responsabilités principales : ${jobContext.responsabilitesPrincipales.join("; ")}`);
  }
  if (jobContext.signauxDistinctifs?.length) {
    lines.push(`Signaux distinctifs de l'entreprise : ${jobContext.signauxDistinctifs.join("; ")}`);
  }
  return lines.length > 0 ? lines.join("\n") : "Aucun contexte de poste disponible.";
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY manquante dans les variables d'environnement.");
    return json({ error: GENERIC_ERROR_MESSAGE }, 500, origin);
  }

  let body: {
    question?: string;
    categorie?: string;
    answer?: string;
    jobContext?: JobContext;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Corps de requête invalide." }, 400, origin);
  }

  const { question, categorie, answer, jobContext } = body;

  if (!question?.trim() || !answer?.trim()) {
    return json(
      { error: "La question et la réponse sont requises pour générer un feedback." },
      400,
      origin,
    );
  }

  if (!categorie || !FEEDBACK_CATEGORIES.includes(categorie as FeedbackCategorie)) {
    return json({ error: "Catégorie de question invalide." }, 400, origin);
  }

  if (question.length > MAX_QUESTION_LENGTH) {
    return json({ error: "Question invalide." }, 400, origin);
  }

  if (answer.length > MAX_ANSWER_LENGTH) {
    return json(
      {
        error: `Ta réponse est trop longue (${MAX_ANSWER_LENGTH.toLocaleString("fr-FR")} caractères maximum).`,
      },
      400,
      origin,
    );
  }

  const categorieTyped = categorie as FeedbackCategorie;
  const includeStar = STAR_CATEGORIES.includes(categorieTyped);

  const client = new Anthropic(
    process.env.ANTHROPIC_WORKSPACE_ID
      ? { defaultHeaders: { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID } }
      : undefined,
  );

  try {
    const response = await client.messages.parse({
      model: "claude-sonnet-5",
      max_tokens: 2000,
      output_config: {
        effort: "medium",
        format: zodOutputFormat(buildFeedbackSchema(includeStar)),
      },
      system: buildSystemPrompt(categorieTyped, includeStar),
      messages: [
        {
          role: "user",
          content: `Contexte du poste :\n${formatJobContext(jobContext)}\n\nQuestion posée : ${question}\n\nRéponse du candidat :\n${answer}`,
        },
      ],
    });

    if (!response.parsed_output) {
      return json(
        { error: "L'évaluation a échoué : réponse du modèle non exploitable. Réessaie." },
        502,
        origin,
      );
    }

    return json(response.parsed_output, 200, origin);
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("Anthropic AuthenticationError:", error.message);
      return json({ error: GENERIC_ERROR_MESSAGE }, 401, origin);
    }
    if (error instanceof Anthropic.RateLimitError) {
      return json(
        { error: "Limite de requêtes atteinte, réessaie dans quelques instants." },
        429,
        origin,
      );
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Anthropic APIError:", error.message);
      return json({ error: GENERIC_ERROR_MESSAGE }, error.status ?? 500, origin);
    }
    console.error("Erreur inattendue lors de la génération du feedback:", error);
    return json({ error: GENERIC_ERROR_MESSAGE }, 500, origin);
  }
}
