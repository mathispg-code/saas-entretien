import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

export const runtime = "nodejs";

const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20] as const;
const DEFAULT_QUESTIONS = 10;

const VARIATION_ANGLES = [
  "Mets l'accent sur des questions techniques précises et approfondies, tout en gardant une ou deux questions comportementales.",
  "Privilégie les questions comportementales et les mises en situation concrètes (méthode STAR), avec moins de questions purement techniques.",
  "Accorde une place importante aux questions sur la culture d'entreprise, les valeurs et la motivation à rejoindre l'entreprise.",
  "Explore davantage les questions de projection à moyen terme (évolution du candidat, ambitions, vision du poste dans 1 à 2 ans).",
  "Mets l'accent sur les questions liées à la collaboration en équipe et à la communication avec d'autres services.",
  "Privilégie des mises en situation variées et originales plutôt que des questions génériques classiques.",
  "Insiste sur les points les plus spécifiques et différenciants de cette fiche de poste plutôt que sur des questions standards du secteur.",
] as const;

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
Varie les types de questions (technique, comportemental, motivation, mise en situation, culture d'entreprise) en fonction de ce que la fiche de poste met en avant.
Si le CV d'un candidat est fourni en plus de la fiche de poste, personnalise chaque conseil en t'appuyant sur ses compétences, expériences et réalisations réelles (par exemple en suggérant de mentionner tel projet ou telle compétence précise pertinente pour la question). Si aucun CV n'est fourni, donne des conseils génériques mais toujours concrets et actionnables.
Important : si cette même fiche de poste a déjà été utilisée pour une génération précédente, les nouvelles questions doivent être différentes — varie l'angle abordé, l'ordre, la formulation et les exemples suggérés dans les conseils. Ne reformule jamais une génération précédente à l'identique. Le message utilisateur te donnera une consigne d'orientation à privilégier pour cette génération précise ; suis-la sans jamais réduire la pertinence des questions par rapport à la fiche de poste (et au CV le cas échéant) — la variété porte sur l'angle et la formulation, jamais sur la pertinence.
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

  if (!QUESTION_COUNT_OPTIONS.includes(questionCount as (typeof QUESTION_COUNT_OPTIONS)[number])) {
    return NextResponse.json(
      {
        error: `Le nombre de questions doit être l'une des valeurs suivantes : ${QUESTION_COUNT_OPTIONS.join(", ")}.`,
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

  const variationId = randomUUID().slice(0, 8);
  const orientation =
    VARIATION_ANGLES[Math.floor(Math.random() * VARIATION_ANGLES.length)];

  userContent.push({
    type: "text",
    text: cvBase64
      ? `Génère exactement ${questionCount} questions d'entretien pour ce poste, avec pour chaque question un conseil personnalisé au profil réel du candidat décrit dans son CV.`
      : `Génère exactement ${questionCount} questions d'entretien pour ce poste, avec un conseil pour chacune.`,
  });

  userContent.push({
    type: "text",
    text: `Consigne d'orientation pour cette génération (id ${variationId}) : ${orientation} Cette orientation ne doit jamais réduire la pertinence des questions par rapport à la fiche de poste.`,
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
