// Server-only: calls the Lovable AI Gateway to analyse a chart image.
import type { AnalysisResult } from "./analysis-types";

const MODEL = "openai/gpt-6-astra";

const levelSchema = {
  type: "object",
  additionalProperties: false,
  required: ["level", "importance", "explanation"],
  properties: {
    level: { type: "string" },
    importance: { type: "string", enum: ["faible", "moyenne", "forte"] },
    explanation: { type: "string" },
  },
};
const directional = {
  type: ["object", "null"],
  additionalProperties: false,
  required: ["conditions", "invalidation", "supporting_elements"],
  properties: {
    conditions: { type: "string" },
    invalidation: { type: "string" },
    supporting_elements: { type: "string" },
  },
};
const nullableString = { type: ["string", "null"] };
const factorSchema = {
  type: "object",
  additionalProperties: false,
  required: ["label", "kind"],
  properties: {
    label: { type: "string" },
    kind: { type: "string", enum: ["positive", "warning"] },
  },
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "is_chart", "image_readable", "asset_detected", "timeframe_detected", "market_detected",
    "summary", "trend", "market_structure", "trend_explanation", "supports", "resistances",
    "indicators", "bullish_scenario", "bearish_scenario", "neutral_scenario", "risk_notes",
    "risk_reward", "analysis_quality", "quality_explanation",
    "bullish_conviction", "bearish_conviction", "data_quality",
    "bullish_factors", "bearish_factors", "conviction_explanation",
  ],
  properties: {
    is_chart: { type: "boolean" },
    image_readable: { type: "boolean" },
    asset_detected: nullableString,
    timeframe_detected: nullableString,
    market_detected: nullableString,
    summary: { type: "string" },
    trend: { type: "string", enum: ["haussière", "baissière", "neutre", "indéterminée"] },
    market_structure: { type: "string" },
    trend_explanation: { type: "string" },
    supports: { type: "array", items: levelSchema },
    resistances: { type: "array", items: levelSchema },
    indicators: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "values", "interpretation"],
        properties: {
          name: { type: "string" },
          values: nullableString,
          interpretation: { type: "string" },
        },
      },
    },
    bullish_scenario: directional,
    bearish_scenario: directional,
    neutral_scenario: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["conditions", "breakout_confirmation"],
      properties: {
        conditions: { type: "string" },
        breakout_confirmation: { type: "string" },
      },
    },
    risk_notes: { type: "string" },
    risk_reward: nullableString,
    analysis_quality: { type: "string", enum: ["Faible", "Moyenne", "Élevée"] },
    quality_explanation: { type: "string" },
    bullish_conviction: { type: "integer" },
    bearish_conviction: { type: "integer" },
    data_quality: { type: "string", enum: ["low", "medium", "high"] },
    bullish_factors: { type: "array", items: factorSchema },
    bearish_factors: { type: "array", items: factorSchema },
    conviction_explanation: { type: "string" },
  },
};

const SYSTEM_PROMPT = `Tu es ChartAI, un assistant d'analyse technique ÉDUCATIVE de graphiques de trading. Tu réponds exclusivement en français.

Règles absolues :
- Analyse UNIQUEMENT les éléments réellement visibles sur l'image. N'invente jamais un prix, un niveau, une valeur d'indicateur ou un actif qui n'est pas lisible.
- Si un indicateur est visible mais pas identifiable avec certitude, utilise exactement le nom « Indicateur non identifiable avec suffisamment de certitude » et values = null.
- Si une valeur n'est pas lisible, mets null. Les niveaux de prix sont approximatifs : préfixe-les par « ≈ ».
- Tu ne connais pas l'avenir du marché. Présente les scénarios comme des possibilités conditionnelles, jamais comme des certitudes.
- N'utilise jamais de formulations comme « achète maintenant », « vends », « tu vas gagner », « trade garanti », ni de conseil financier personnalisé.
- risk_reward : calcule-le uniquement si les niveaux visibles le permettent, sinon null.
- risk_notes : rappel éducatif sur le risque, l'invalidation et le fait de ne jamais risquer une somme qu'on ne peut pas se permettre de perdre.
- analysis_quality reflète UNIQUEMENT la netteté et la quantité d'informations visibles dans la capture, jamais une probabilité de gain.
- Si l'image n'est pas un graphique financier : is_chart = false. Si elle est floue ou trop incomplète : image_readable = false et explique-le dans summary.
- Mets un scénario à null si les données ne permettent pas de le formuler.

Conviction technique :
- bullish_conviction et bearish_conviction : entiers de 0 à 100 mesurant la COHÉRENCE des éléments techniques visibles avec chaque scénario. Ce n'est PAS une probabilité. Les deux scores sont indépendants et n'ont pas à totaliser 100.
- Facteurs possibles : tendance générale, structure de marché, supports, résistances, cassures et retests visibles, moyennes mobiles, RSI, MACD, volume, figures chartistes claires, cohérence entre éléments, lisibilité de la capture.
- Chaque facteur a une influence limitée (aucun facteur seul ne doit dépasser environ 20 points). Un élément non visible ou non identifiable n'est ni inventé ni utilisé dans le calcul.
- Reste prudent : si la capture est floue, partielle ou pauvre en informations, garde les deux scores modérés ou bas (rarement au-delà de 60).
- data_quality : low / medium / high selon la lisibilité et la quantité d'informations visibles.
- bullish_factors / bearish_factors : 2 à 5 facteurs courts (quelques mots). kind = "positive" pour un élément qui soutient le scénario, "warning" pour une limite ou un élément manquant.
- conviction_explanation : 1 à 3 phrases expliquant ce qui soutient et limite chaque conviction, basées uniquement sur les éléments détectés. N'écris jamais « X% de chances », écris « X% de conviction technique … selon les éléments visibles ».`;

export class ChartAIError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

export async function analyzeChartImage(input: {
  imageUrl: string;
  asset?: string | null | undefined;
  timeframe?: string | null | undefined;
  market?: string | null | undefined;
}): Promise<AnalysisResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new ChartAIError("Le service d'analyse n'est pas configuré.");

  const context = [
    `Actif renseigné : ${input.asset || "non renseigné"}`,
    `Timeframe renseignée : ${input.timeframe || "non renseignée"}`,
    `Marché renseigné : ${input.market || "non renseigné"}`,
  ].join("\n");

  let response: Response;
  try {
    response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        store: false,
        reasoning: { effort: "medium", summary: "auto" },
        include: ["reasoning.encrypted_content"],
        instructions: SYSTEM_PROMPT,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: `Analyse ce graphique.\n${context}` },
              { type: "input_image", image_url: input.imageUrl },
            ],
          },
        ],
        text: {
          format: { type: "json_schema", name: "chart_analysis", strict: true, schema: SCHEMA },
        },
      }),
    });
  } catch {
    throw new ChartAIError("Le service d'IA ne répond pas. Réessayez dans quelques instants.", 503);
  }

  if (!response.ok || !response.body) {
    const body = await response.text().catch(() => "");
    console.error("AI gateway error", response.status, body.slice(0, 500));
    if (response.status === 429)
      throw new ChartAIError("Trop de demandes en ce moment. Réessayez dans une minute.", 429);
    if (response.status === 402)
      throw new ChartAIError("Crédits d'IA épuisés. Le service est temporairement indisponible.", 402);
    throw new ChartAIError("L'analyse a échoué. Réessayez dans quelques instants.", 502);
  }

  // Consume the SSE stream and collect the output text.
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let finalText: string | null = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const evt = JSON.parse(data);
        if (evt.type === "response.output_text.delta") text += evt.delta ?? "";
        else if (evt.type === "response.output_text.done" && typeof evt.text === "string") finalText = evt.text;
        else if (evt.type === "response.failed" || evt.type === "error") {
          throw new ChartAIError("L'analyse a échoué. Réessayez dans quelques instants.", 502);
        }
      } catch (e) {
        if (e instanceof ChartAIError) throw e;
      }
    }
  }

  const raw = finalText ?? text;
  try {
    return JSON.parse(raw) as AnalysisResult;
  } catch {
    console.error("Invalid AI JSON", raw.slice(0, 300));
    throw new ChartAIError("L'analyse a échoué. Réessayez avec une autre capture.", 502);
  }
}
