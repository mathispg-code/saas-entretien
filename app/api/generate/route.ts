import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

export const runtime = "nodejs";

const MIN_QUESTIONS = 6;
const MAX_QUESTIONS = 20;
const DEFAULT_QUESTIONS = 10;

function buildQuestionsSchema(count: number) {
  return z.object({
    questions: z
      .array(
        z.object({
          question: z.string(),
          conseil: z.string(),
        }),
      )
      .length(count),
  });
}

function buildSystemPrompt(count: number) {
  return `Tu es un recruteur senior avec 15 ans d'expérience en entretiens d'embauche.
On te fournit le texte (ou le document) d'une fiche de poste.
Ta tâche : à partir des compétences, responsabilités et exigences mentionnées, génère une liste d'exactement ${count} questions d'entretien probables qu'un recruteur poserait pour ce poste précis. Ce nombre est impératif : ni plus, ni moins.
Pour chaque question, donne un conseil court (1 à 2 phrases) sur la manière d'y répondre efficacement.
Varie les types de questions (technique, comportemental, motivation, mise en situation) en fonction de ce que la fiche de poste met en avant.
Si le CV d'un candidat est fourni en plus de la fiche de poste, personnalise chaque conseil en t'appuyant sur ses compétences, expériences et réalisations réelles (par exemple en suggérant de mentionner tel projet ou telle compétence précise pertinente pour la question). Si aucun CV n'est fourni, donne des conseils génériques mais toujours concrets et actionnables.
Réponds en français.`;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "La clé API Anthropic n'est pas configurée sur le serveur (ANTHROPIC_API_KEY manquante dans .env.local).",
      },
      { status: 500 },
    );
  }

  let body: {
    text?: string;
    pdfBase64?: string;
    pdfFilename?: string;
    cvBase64?: string;
    cvFilename?: string;
    questionCount?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const { text, pdfBase64, cvBase64, questionCount = DEFAULT_QUESTIONS } = body;

  if (!text?.trim() && !pdfBase64) {
    return NextResponse.json(
      { error: "Merci de coller le texte de la fiche de poste ou d'importer un PDF." },
      { status: 400 },
    );
  }

  if (
    !Number.isInteger(questionCount) ||
    questionCount % 2 !== 0 ||
    questionCount < MIN_QUESTIONS ||
    questionCount > MAX_QUESTIONS
  ) {
    return NextResponse.json(
      {
        error: `Le nombre de questions doit être un nombre pair entre ${MIN_QUESTIONS} et ${MAX_QUESTIONS}.`,
      },
      { status: 400 },
    );
  }

  const userContent: Anthropic.MessageParam["content"] = [];

  if (pdfBase64) {
    userContent.push({
      type: "text",
      text: "Voici la fiche de poste (document ci-dessous) :",
    });
    userContent.push({
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: pdfBase64,
      },
    });
  } else if (text) {
    userContent.push({
      type: "text",
      text: `Voici la fiche de poste :\n\n${text}`,
    });
  }

  if (cvBase64) {
    userContent.push({
      type: "text",
      text: "Voici le CV du candidat (document ci-dessous), à utiliser uniquement pour personnaliser les conseils de réponse à chaque question — ne génère pas de questions sur le CV lui-même :",
    });
    userContent.push({
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: cvBase64,
      },
    });
  }

  userContent.push({
    type: "text",
    text: cvBase64
      ? `Génère exactement ${questionCount} questions d'entretien pour ce poste, avec pour chaque question un conseil personnalisé au profil réel du candidat décrit dans son CV.`
      : `Génère exactement ${questionCount} questions d'entretien pour ce poste, avec un conseil pour chacune.`,
  });

  const client = new Anthropic(
    process.env.ANTHROPIC_WORKSPACE_ID
      ? { defaultHeaders: { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID } }
      : undefined,
  );

  try {
    const response = await client.messages.parse({
      model: "claude-sonnet-5",
      max_tokens: 8192,
      output_config: {
        effort: "medium",
        format: zodOutputFormat(buildQuestionsSchema(questionCount)),
      },
      system: buildSystemPrompt(questionCount),
      messages: [{ role: "user", content: userContent }],
    });

    if (!response.parsed_output) {
      return NextResponse.json(
        { error: "La génération a échoué : réponse du modèle non exploitable. Réessaie." },
        { status: 502 },
      );
    }

    return NextResponse.json(response.parsed_output);
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "Clé API Anthropic invalide. Vérifie ANTHROPIC_API_KEY dans .env.local." },
        { status: 401 },
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Limite de requêtes atteinte, réessaie dans quelques instants." },
        { status: 429 },
      );
    }
    if (error instanceof Anthropic.BadRequestError) {
      return NextResponse.json(
        { error: `Requête invalide envoyée à Claude : ${error.message}` },
        { status: 400 },
      );
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Erreur de l'API Anthropic : ${error.message}` },
        { status: error.status ?? 500 },
      );
    }
    return NextResponse.json({ error: "Erreur inattendue lors de la génération." }, { status: 500 });
  }
}
