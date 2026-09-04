import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { GENERIC_ERROR_MESSAGE, json, optionsResponse } from "../../lib/api-response";

export const runtime = "nodejs";

const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20] as const;
const DEFAULT_QUESTIONS = 10;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_TEXT_LENGTH = 20_000;

function base64ByteLength(base64: string): number {
  return Math.ceil((base64.length * 3) / 4);
}

function isPdfSignature(base64: string): boolean {
  // Un PDF valide commence toujours par la signature ASCII "%PDF-".
  // On ne decode qu'un court prefixe pour eviter de decoder un gros fichier
  // en entier juste pour cette verification.
  const prefix = Buffer.from(base64.slice(0, 12), "base64");
  return prefix.length >= 5 && prefix.subarray(0, 5).toString("latin1") === "%PDF-";
}

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

const VARIATION_ANGLES = [
  "Mets l'accent sur des questions techniques précises et approfondies, tout en gardant une ou deux questions comportementales.",
  "Privilégie les questions comportementales et les mises en situation concrètes (méthode STAR), avec moins de questions purement techniques.",
  "Accorde une place importante aux questions sur la culture d'entreprise, les valeurs et la motivation à rejoindre l'entreprise.",
  "Explore davantage les questions de projection à moyen terme (évolution du candidat, ambitions, vision du poste dans 1 à 2 ans).",
  "Mets l'accent sur les questions liées à la collaboration en équipe et à la communication avec d'autres services.",
  "Privilégie des mises en situation variées et originales plutôt que des questions génériques classiques.",
  "Insiste sur les points les plus spécifiques et différenciants de cette fiche de poste plutôt que sur des questions standards du secteur.",
] as const;

const QUESTION_CATEGORIES = [
  "technique",
  "comportementale",
  "situationnelle",
  "motivation",
  "culture",
] as const;

function buildQuestionsSchema(count: number) {
  const conseil = z.object({
    objectif: z.string(),
    conseil: z.string(),
  });

  return z.object({
    analyse: z.object({
      competencesCles: z.array(z.string()),
      responsabilitesPrincipales: z.array(z.string()),
      niveauSeniorite: z.string(),
      signauxDistinctifs: z.array(z.string()),
    }),
    questions: z
      .array(
        z.object({
          question: z.string(),
          categorie: z.enum(QUESTION_CATEGORIES),
          conseil,
        }),
      )
      .length(count),
  });
}

function buildSystemPrompt(count: number, hasCv: boolean) {
  return `Tu es un recruteur senior avec 15 ans d'expérience en entretiens d'embauche.
On te fournit le texte (ou le document) d'une fiche de poste${hasCv ? ", ainsi que le CV d'un candidat" : ""}.

Étape 1 — Analyse : avant de générer la moindre question, analyse la fiche de poste pour identifier :
- les compétences clés recherchées
- les responsabilités principales du poste
- le niveau de séniorité attendu
- les éventuels signaux distinctifs de l'entreprise ou du secteur (valeurs, secteur d'activité, taille, méthode de travail, etc. — liste vide si rien de notable n'apparaît dans le texte)
Cette analyse doit guider directement la génération des questions : ne produis jamais de questions génériques déconnectées de ce que tu viens d'identifier.

Étape 2 — Génère exactement ${count} questions d'entretien probables pour ce poste précis. Ce nombre est impératif : ni plus, ni moins.
Répartis les questions entre ces catégories, en proportions équilibrées adaptées au nombre total demandé :
- technique : la part la plus importante, sur les compétences et outils précis mentionnés dans la fiche
- comportementale : une part significative
- situationnelle (mise en situation concrète) : une part significative, du même ordre que la comportementale
- motivation / adéquation avec le poste : quelques questions
- culture d'entreprise : 1 à 2 questions maximum, uniquement si la fiche contient des indices clairs sur la culture, les valeurs ou le secteur de l'entreprise — sinon n'en inclus aucune et redistribue vers les autres catégories.
Indique la catégorie de chaque question dans le champ prévu à cet effet.

Étape 3 — Pour chaque question, donne un conseil de réponse en 2 éléments courts (une à deux phrases chacun, jamais un pavé de texte) :
- objectif : ce que le recruteur cherche réellement à évaluer avec cette question précise
- conseil : une recommandation concrète et actionnable pour bien y répondre, en 1 à 2 phrases courtes maximum — jamais une seule phrase à rallonge qui empile plusieurs idées avec des virgules. Mentionne la méthode de réponse suggérée seulement si elle apporte une vraie valeur (par exemple la méthode STAR pour une question comportementale ou situationnelle), et glisse un point de vigilance uniquement s'il est vraiment utile pour cette question précise — n'essaie pas de caser systématiquement les deux à chaque fois, comme le ferait un recruteur qui donne un conseil oral synthétique, pas un rapport détaillé.
${hasCv ? "Si un CV a été fourni et qu'un lien concret avec l'expérience réelle du candidat est pertinent pour cette question, glisse-le brièvement dans la phrase de conseil, sans champ séparé. Base-toi uniquement sur ce qui est réellement écrit dans le CV, n'invente rien." : "Aucun CV n'a été fourni : donne des conseils génériques mais toujours concrets et actionnables."}

Important : si cette même fiche de poste a déjà été utilisée pour une génération précédente, les nouvelles questions doivent être différentes — varie l'angle abordé, l'ordre, la formulation et les exemples suggérés dans les conseils. Ne reformule jamais une génération précédente à l'identique. Le message utilisateur te donnera une consigne d'orientation à privilégier pour cette génération précise ; suis-la sans jamais réduire la pertinence des questions par rapport à la fiche de poste (et au CV le cas échéant) — la variété porte sur l'angle et la formulation, jamais sur la pertinence.
Réponds en français.`;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY manquante dans les variables d'environnement.");
    return json({ error: GENERIC_ERROR_MESSAGE }, 500, origin);
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
    return json({ error: "Corps de requête invalide." }, 400, origin);
  }

  const { text, pdfBase64, cvBase64, questionCount = DEFAULT_QUESTIONS } = body;

  if (!text?.trim() && !pdfBase64) {
    return json(
      { error: "Merci de coller le texte de la fiche de poste ou d'importer un PDF." },
      400,
      origin,
    );
  }

  if (text && text.length > MAX_TEXT_LENGTH) {
    return json(
      {
        error: `Le texte de la fiche de poste est trop long (${MAX_TEXT_LENGTH.toLocaleString("fr-FR")} caractères maximum).`,
      },
      400,
      origin,
    );
  }

  if (!QUESTION_COUNT_OPTIONS.includes(questionCount as (typeof QUESTION_COUNT_OPTIONS)[number])) {
    return json(
      {
        error: `Le nombre de questions doit être l'une des valeurs suivantes : ${QUESTION_COUNT_OPTIONS.join(", ")}.`,
      },
      400,
      origin,
    );
  }

  if (pdfBase64 && base64ByteLength(pdfBase64) > MAX_FILE_SIZE_BYTES) {
    return json({ error: "Le fichier est trop volumineux, 5 Mo maximum." }, 413, origin);
  }

  if (cvBase64 && base64ByteLength(cvBase64) > MAX_FILE_SIZE_BYTES) {
    return json({ error: "Le fichier est trop volumineux, 5 Mo maximum." }, 413, origin);
  }

  if (pdfBase64 && !isPdfSignature(pdfBase64)) {
    return json(
      { error: "Le fichier de la fiche de poste ne semble pas être un PDF valide." },
      400,
      origin,
    );
  }

  if (cvBase64 && !isPdfSignature(cvBase64)) {
    return json({ error: "Le fichier du CV ne semble pas être un PDF valide." }, 400, origin);
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

  const hasCv = Boolean(cvBase64);

  try {
    const response = await client.messages.parse({
      model: "claude-sonnet-5",
      max_tokens: 12000,
      output_config: {
        effort: "high",
        format: zodOutputFormat(buildQuestionsSchema(questionCount)),
      },
      system: buildSystemPrompt(questionCount, hasCv),
      messages: [{ role: "user", content: userContent }],
    });

    if (!response.parsed_output) {
      return json(
        { error: "La génération a échoué : réponse du modèle non exploitable. Réessaie." },
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
    if (error instanceof Anthropic.BadRequestError) {
      console.error("Anthropic BadRequestError:", error.message);
      return json(
        {
          error:
            "Le fichier semble corrompu ou illisible, ou la fiche de poste est invalide. Réessaie avec un autre fichier.",
        },
        400,
        origin,
      );
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Anthropic APIError:", error.message);
      return json({ error: GENERIC_ERROR_MESSAGE }, error.status ?? 500, origin);
    }
    console.error("Erreur inattendue lors de la génération:", error);
    return json({ error: GENERIC_ERROR_MESSAGE }, 500, origin);
  }
}
