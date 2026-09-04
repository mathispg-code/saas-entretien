import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { Allow as PartialJsonAllow, parse as partialParseJson } from "partial-json";
import { z } from "zod";
import { corsHeaders, GENERIC_ERROR_MESSAGE, optionsResponse } from "../../lib/api-response";

export const runtime = "nodejs";
// La generation est streamee (voir plus bas) pour eviter d'attendre la fin
// complete avant d'envoyer quoi que ce soit. maxDuration reste neanmoins le
// temps d'execution total autorise par Vercel : le streaming ne l'augmente
// pas, il faut aussi que la generation reelle tienne dans ce budget. 60 est
// le maximum autorise sur le plan Hobby.
export const maxDuration = 60;

// Filet de securite : si la generation reelle approche la limite de 60s,
// Vercel tue la fonction sans egard pour le stream en cours, potentiellement
// au milieu d'un envoi (connexion coupee brutalement, sans evenement "error"
// ni "done"). On s'interrompt donc nous-memes un peu avant, pour avoir le
// temps d'envoyer un message clair et de fermer proprement. Les elements
// deja emis pendant le streaming restent acquis cote client.
const SOFT_DEADLINE_MS = 57_000;
const SOFT_DEADLINE_MESSAGE = "La génération prend plus de temps que prévu, réessaie.";

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

// Schemas unitaires (reutilises pour valider chaque element au fur et a
// mesure qu'il devient complet dans le flux, en plus du schema global qui
// contraint la sortie du modele).
const AnalyseSchema = z.object({
  competencesCles: z.array(z.string()),
  responsabilitesPrincipales: z.array(z.string()),
  niveauSeniorite: z.string(),
  signauxDistinctifs: z.array(z.string()),
});

const ConseilSchema = z.object({
  objectif: z.string(),
  conseil: z.string(),
});

const QuestionSchema = z.object({
  question: z.string(),
  categorie: z.enum(QUESTION_CATEGORIES),
  conseil: ConseilSchema,
  astuce: z.string(),
});

const VigilancePointSchema = z.object({
  point: z.string(),
  questionProbable: z.string(),
  conseil: z.string(),
});

const APoserItemSchema = z.object({
  question: z.string(),
  pourquoi: z.string(),
});

function buildQuestionsSchema(count: number, hasCv: boolean) {
  return z.object({
    analyse: AnalyseSchema,
    questions: z.array(QuestionSchema).length(count),
    questionsAPoser: z.array(APoserItemSchema).min(2).max(3),
    ...(hasCv ? { pointsVigilanceCv: z.array(VigilancePointSchema).min(3).max(5) } : {}),
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

Étape 3 — Pour chaque question, donne :
- un conseil de réponse en 2 éléments courts (une à deux phrases chacun, jamais un pavé de texte) :
  - objectif : ce que le recruteur cherche réellement à évaluer avec cette question précise
  - conseil : une recommandation concrète et actionnable sur le fond de la réponse (QUOI dire), en 1 à 2 phrases courtes maximum — jamais une seule phrase à rallonge qui empile plusieurs idées avec des virgules. Mentionne un point de vigilance uniquement s'il est vraiment utile pour cette question précise.
${hasCv ? "  Si un CV a été fourni et qu'un lien concret avec l'expérience réelle du candidat est pertinent pour cette question, glisse-le brièvement dans la phrase de conseil, sans champ séparé. Base-toi uniquement sur ce qui est réellement écrit dans le CV, n'invente rien." : "  Aucun CV n'a été fourni : donne des conseils génériques mais toujours concrets et actionnables."}
- astuce : une astuce courte (une phrase) sur COMMENT structurer la réponse à cette question précise (par exemple : par quoi commencer, quel enchaînement suivre, quel format adopter — la méthode STAR si pertinent pour une question comportementale ou situationnelle). Ce champ porte sur la forme et la structuration, jamais sur le contenu déjà couvert par le champ conseil — ne répète pas la même idée dans les deux champs.

${hasCv ? `Étape 4 — Analyse le CV du candidat pour identifier entre 3 et 5 points de vigilance que le recruteur va probablement creuser en entretien (par exemple : trou de carrière, changement de secteur ou de métier, compétence mentionnée mais jamais illustrée par une expérience concrète, poste occupé sur une durée courte, écart entre le niveau du poste visé et l'expérience réelle, etc.). N'en force pas 5 si le CV n'en présente que 3 de façon crédible : reste honnête, n'invente jamais un problème qui n'existe pas. Pour chaque point, donne :
- point : le point de vigilance identifié, formulé de façon factuelle et neutre, jamais accusatrice
- questionProbable : la question précise que le recruteur poserait probablement à ce sujet
- conseil : comment y répondre sereinement et avec confiance, de façon concrète et actionnable
Base-toi uniquement sur ce qui est réellement écrit dans le CV, n'invente rien.` : ""}

Étape ${hasCv ? "5" : "4"} — Génère aussi entre 2 et 3 questions pertinentes que LE CANDIDAT pourrait poser au recruteur en fin d'entretien, basées sur le poste et, si elle est mentionnée dans la fiche, sur l'entreprise elle-même (pas des questions génériques passe-partout). Pour chacune, donne dans "pourquoi" une phrase expliquant en quoi cette question est intéressante à poser dans ce contexte précis.

Important : si cette même fiche de poste a déjà été utilisée pour une génération précédente, les nouvelles questions doivent être différentes — varie l'angle abordé, l'ordre, la formulation et les exemples suggérés dans les conseils. Ne reformule jamais une génération précédente à l'identique. Le message utilisateur te donnera une consigne d'orientation à privilégier pour cette génération précise ; suis-la sans jamais réduire la pertinence des questions par rapport à la fiche de poste (et au CV le cas échéant) — la variété porte sur l'angle et la formulation, jamais sur la pertinence.
Réponds en français.`;
}

type StreamEvent =
  | { type: "analyse"; data: z.infer<typeof AnalyseSchema> }
  | { type: "question"; data: z.infer<typeof QuestionSchema> }
  | { type: "vigilance"; data: z.infer<typeof VigilancePointSchema> }
  | { type: "aPoser"; data: z.infer<typeof APoserItemSchema> }
  | { type: "done" }
  | { type: "error"; message: string };

function ndjsonResponse(
  origin: string | null,
  status: number,
  run: (send: (event: StreamEvent) => void) => Promise<void>,
) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      try {
        await run(send);
      } catch (error) {
        console.error("Erreur inattendue pendant le streaming de la génération:", error);
        send({ type: "error", message: GENERIC_ERROR_MESSAGE });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      ...corsHeaders(origin),
    },
  });
}

function errorStream(message: string, status: number, origin: string | null) {
  return ndjsonResponse(origin, status, async (send) => {
    send({ type: "error", message });
  });
}

function anthropicErrorMessage(error: unknown): { message: string; status: number } {
  if (error instanceof Anthropic.AuthenticationError) {
    console.error("Anthropic AuthenticationError:", error.message);
    return { message: GENERIC_ERROR_MESSAGE, status: 401 };
  }
  if (error instanceof Anthropic.RateLimitError) {
    return { message: "Limite de requêtes atteinte, réessaie dans quelques instants.", status: 429 };
  }
  if (error instanceof Anthropic.BadRequestError) {
    console.error("Anthropic BadRequestError:", error.message);
    return {
      message: "Le fichier semble corrompu ou illisible, ou la fiche de poste est invalide. Réessaie avec un autre fichier.",
      status: 400,
    };
  }
  if (error instanceof Anthropic.APIError) {
    console.error("Anthropic APIError:", error.message);
    return { message: GENERIC_ERROR_MESSAGE, status: error.status ?? 500 };
  }
  console.error("Erreur inattendue lors de la génération:", error);
  return { message: GENERIC_ERROR_MESSAGE, status: 500 };
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY manquante dans les variables d'environnement.");
    return errorStream(GENERIC_ERROR_MESSAGE, 500, origin);
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
    return errorStream("Corps de requête invalide.", 400, origin);
  }

  const { text, pdfBase64, cvBase64, questionCount = DEFAULT_QUESTIONS } = body;

  if (!text?.trim() && !pdfBase64) {
    return errorStream("Merci de coller le texte de la fiche de poste ou d'importer un PDF.", 400, origin);
  }

  if (text && text.length > MAX_TEXT_LENGTH) {
    return errorStream(
      `Le texte de la fiche de poste est trop long (${MAX_TEXT_LENGTH.toLocaleString("fr-FR")} caractères maximum).`,
      400,
      origin,
    );
  }

  if (!QUESTION_COUNT_OPTIONS.includes(questionCount as (typeof QUESTION_COUNT_OPTIONS)[number])) {
    return errorStream(
      `Le nombre de questions doit être l'une des valeurs suivantes : ${QUESTION_COUNT_OPTIONS.join(", ")}.`,
      400,
      origin,
    );
  }

  if (pdfBase64 && base64ByteLength(pdfBase64) > MAX_FILE_SIZE_BYTES) {
    return errorStream("Le fichier est trop volumineux, 5 Mo maximum.", 413, origin);
  }

  if (cvBase64 && base64ByteLength(cvBase64) > MAX_FILE_SIZE_BYTES) {
    return errorStream("Le fichier est trop volumineux, 5 Mo maximum.", 413, origin);
  }

  if (pdfBase64 && !isPdfSignature(pdfBase64)) {
    return errorStream("Le fichier de la fiche de poste ne semble pas être un PDF valide.", 400, origin);
  }

  if (cvBase64 && !isPdfSignature(cvBase64)) {
    return errorStream("Le fichier du CV ne semble pas être un PDF valide.", 400, origin);
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

  return ndjsonResponse(origin, 200, async (send) => {
    let emittedAnalyse = false;
    let emittedQuestions = 0;
    let emittedVigilance = 0;
    let emittedAPoser = 0;
    let deadlineHit = false;
    let deadlineTimer: ReturnType<typeof setTimeout> | undefined;

    try {
      const anthropicStream = client.messages.stream({
        model: "claude-sonnet-5",
        max_tokens: 14000,
        output_config: {
          // Mesure empirique : "high" (et l'absence d'effort) declenchent une
          // phase de raisonnement interne ("thinking") qui ajoute 20-30s+ au
          // pire cas (CV + 20 questions : 83s sans effort, 62s en "high"),
          // sans amelioration de qualite constatee. "medium" evite cette
          // phase et reste autour de 52-54s dans les memes conditions.
          effort: "medium",
          format: zodOutputFormat(buildQuestionsSchema(questionCount, hasCv)),
        },
        system: buildSystemPrompt(questionCount, hasCv),
        messages: [{ role: "user", content: userContent }],
      });

      deadlineTimer = setTimeout(() => {
        deadlineHit = true;
        anthropicStream.abort();
      }, SOFT_DEADLINE_MS);

      // La sortie structuree arrive comme un bloc "text" contenant du JSON
      // brut (pas un tool_use : l'evenement "inputJson" ne se declenche donc
      // jamais ici). On parse le JSON partiel accumule a chaque delta pour
      // en extraire les elements de tableau deja complets.
      anthropicStream.on("text", (_delta, textSnapshot) => {
        let data: {
          analyse?: unknown;
          questions?: unknown[];
          questionsAPoser?: unknown[];
          pointsVigilanceCv?: unknown[];
        };
        try {
          // Autorise tout (objets et tableaux ouverts, y compris l'objet
          // racine lui-meme) : sans ca, aucun element ne remonte tant que le
          // JSON entier n'est pas termine. La securite vient ensuite du
          // schema Zod applique a chaque element avant de l'emettre : un
          // element encore incomplet echoue simplement la validation et
          // attend le prochain delta.
          data = partialParseJson(textSnapshot, PartialJsonAllow.ALL);
        } catch {
          return;
        }

        if (!emittedAnalyse && data.analyse) {
          const parsed = AnalyseSchema.safeParse(data.analyse);
          if (parsed.success) {
            send({ type: "analyse", data: parsed.data });
            emittedAnalyse = true;
          }
        }

        if (Array.isArray(data.questions)) {
          for (let i = emittedQuestions; i < data.questions.length; i++) {
            const parsed = QuestionSchema.safeParse(data.questions[i]);
            if (!parsed.success) break;
            send({ type: "question", data: parsed.data });
            emittedQuestions++;
          }
        }

        if (Array.isArray(data.pointsVigilanceCv)) {
          for (let i = emittedVigilance; i < data.pointsVigilanceCv.length; i++) {
            const parsed = VigilancePointSchema.safeParse(data.pointsVigilanceCv[i]);
            if (!parsed.success) break;
            send({ type: "vigilance", data: parsed.data });
            emittedVigilance++;
          }
        }

        if (Array.isArray(data.questionsAPoser)) {
          for (let i = emittedAPoser; i < data.questionsAPoser.length; i++) {
            const parsed = APoserItemSchema.safeParse(data.questionsAPoser[i]);
            if (!parsed.success) break;
            send({ type: "aPoser", data: parsed.data });
            emittedAPoser++;
          }
        }
      });

      const finalMessage = await anthropicStream.finalMessage();
      clearTimeout(deadlineTimer);

      if (!finalMessage.parsed_output) {
        send({
          type: "error",
          message: "La génération a échoué : réponse du modèle non exploitable. Réessaie.",
        });
        return;
      }

      // Passe de rattrapage : au cas ou un element n'aurait pas ete detecte
      // pendant le streaming (defensif, ne devrait normalement pas arriver).
      const output = finalMessage.parsed_output as {
        analyse: z.infer<typeof AnalyseSchema>;
        questions: z.infer<typeof QuestionSchema>[];
        questionsAPoser: z.infer<typeof APoserItemSchema>[];
        pointsVigilanceCv?: z.infer<typeof VigilancePointSchema>[];
      };

      if (!emittedAnalyse) {
        send({ type: "analyse", data: output.analyse });
      }
      for (let i = emittedQuestions; i < output.questions.length; i++) {
        send({ type: "question", data: output.questions[i] });
      }
      if (output.pointsVigilanceCv) {
        for (let i = emittedVigilance; i < output.pointsVigilanceCv.length; i++) {
          send({ type: "vigilance", data: output.pointsVigilanceCv[i] });
        }
      }
      for (let i = emittedAPoser; i < output.questionsAPoser.length; i++) {
        send({ type: "aPoser", data: output.questionsAPoser[i] });
      }

      send({ type: "done" });
    } catch (error) {
      clearTimeout(deadlineTimer);
      if (deadlineHit) {
        send({ type: "error", message: SOFT_DEADLINE_MESSAGE });
        return;
      }
      const { message } = anthropicErrorMessage(error);
      send({ type: "error", message });
    }
  });
}
