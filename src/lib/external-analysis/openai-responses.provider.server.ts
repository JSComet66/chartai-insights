// Server-only: OpenAI Responses API adapter (direct, official endpoint).
// Key: process.env.OPENAI_API_KEY (server only). Model: process.env.OPENAI_MODEL or DEFAULT_OPENAI_MODEL.
import { ANALYSIS_JSON_SCHEMA, parseAnalysisResult } from "./openai-schema";
import { ExternalAnalysisError, type ExternalAnalysisProvider, type ExternalAnalysisRequest } from "./types";

export const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
export const DEFAULT_OPENAI_MODEL = "gpt-5.4-mini";
export const OPENAI_TIMEOUT_MS = 90_000;
export const OPENAI_NOT_CONFIGURED_MESSAGE =
  "Service d’analyse IA non configuré : la clé OPENAI_API_KEY doit être configurée côté serveur.";

const MSG = {
  auth: "Le service d’analyse IA est mal configuré côté serveur. Contactez l’administrateur.",
  rate: "Le service d’analyse IA est momentanément saturé. Réessayez dans quelques instants.",
  down: "Le service d’analyse IA ne répond pas. Réessayez plus tard.",
  timeout: "Le service d’analyse IA a mis trop de temps à répondre. Réessayez.",
  refused: "Le service d’analyse IA n’a pas pu traiter cette image. Essayez avec une autre capture de graphique.",
  invalid: "La réponse du service d’analyse est incomplète ou invalide. Réessayez.",
  bad: "La requête d’analyse a été refusée. Vérifiez l’image et réessayez.",
};

const readKey = () => process.env["OPENAI_API_KEY"]?.trim() || "";
const readModel = () => process.env["OPENAI_MODEL"]?.trim() || DEFAULT_OPENAI_MODEL;

function userText(req: ExternalAnalysisRequest) {
  return [
    "Analyse cette capture de graphique de trading de façon uniquement éducative.",
    `Actif renseigné : ${req.asset ?? "non renseigné"}`,
    `Timeframe renseigné : ${req.timeframe ?? "non renseigné"}`,
    `Marché renseigné : ${req.market ?? "non renseigné"}`,
  ].join("\n");
}

type ResponsesPayload = {
  status?: string;
  output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string; refusal?: string }> }>;
};

export function extractOutput(payload: ResponsesPayload): { text: string | null; refused: boolean } {
  let text = "";
  let refused = false;
  for (const item of payload.output ?? []) {
    if (item.type !== "message") continue;
    for (const c of item.content ?? []) {
      if (c.type === "refusal") refused = true;
      if (c.type === "output_text" && typeof c.text === "string") text += c.text;
    }
  }
  return { text: text.trim() || null, refused };
}

export function createOpenAIResponsesProvider(deps: { fetch?: typeof fetch; timeoutMs?: number } = {}): ExternalAnalysisProvider {
  const doFetch = deps.fetch ?? fetch;
  const timeoutMs = deps.timeoutMs ?? OPENAI_TIMEOUT_MS;
  return {
    id: "openai-responses",
    isConfigured: () => readKey().length > 0,
    async analyze(req, signal) {
      const key = readKey();
      if (!key) throw new ExternalAnalysisError("not_configured", OPENAI_NOT_CONFIGURED_MESSAGE);

      const timeout = AbortSignal.timeout(timeoutMs);
      const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

      let res: Response;
      try {
        res = await doFetch(OPENAI_RESPONSES_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          signal: combined,
          body: JSON.stringify({
            model: readModel(),
            store: false,
            instructions: req.instructions,
            input: [
              {
                role: "user",
                content: [
                  { type: "input_text", text: userText(req) },
                  { type: "input_image", image_url: req.image.dataUrl, detail: "high" },
                ],
              },
            ],
            text: {
              format: { type: "json_schema", name: "chartai_analysis", strict: true, schema: ANALYSIS_JSON_SCHEMA },
            },
          }),
        });
      } catch (e) {
        const name = (e as { name?: string })?.name;
        if (name === "TimeoutError" || (name === "AbortError" && timeout.aborted)) {
          throw new ExternalAnalysisError("provider_unavailable", MSG.timeout);
        }
        throw new ExternalAnalysisError("provider_unavailable", MSG.down);
      }

      if (!res.ok) {
        // Log status only — never the body (could echo request data), never the key.
        console.error(`[openai-responses] HTTP ${res.status}`);
        if (res.status === 401 || res.status === 403) throw new ExternalAnalysisError("provider_unavailable", MSG.auth);
        if (res.status === 429) throw new ExternalAnalysisError("provider_unavailable", MSG.rate);
        if (res.status >= 500) throw new ExternalAnalysisError("provider_unavailable", MSG.down);
        throw new ExternalAnalysisError("provider_unavailable", MSG.bad);
      }

      let payload: ResponsesPayload;
      try {
        payload = (await res.json()) as ResponsesPayload;
      } catch {
        throw new ExternalAnalysisError("invalid_response", MSG.invalid);
      }
      const { text, refused } = extractOutput(payload);
      if (refused) throw new ExternalAnalysisError("invalid_response", MSG.refused);
      if (payload.status && payload.status !== "completed") throw new ExternalAnalysisError("invalid_response", MSG.invalid);
      if (!text) throw new ExternalAnalysisError("invalid_response", MSG.invalid);

      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch {
        throw new ExternalAnalysisError("invalid_response", MSG.invalid);
      }
      const result = parseAnalysisResult(raw);
      if (!result) throw new ExternalAnalysisError("invalid_response", MSG.invalid);
      return result;
    },
  };
}
