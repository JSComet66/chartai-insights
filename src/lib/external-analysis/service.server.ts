// Server-only: validates/normalises the request, applies ChartAI rules, delegates to the provider.
import type { AnalysisResult } from "../analysis-types";
import { ACCEPTED_TYPES, MAX_FILE_SIZE } from "../analysis-types";
import { CHARTAI_ANALYSIS_RULES } from "./rules";
import { getExternalAnalysisProvider, SERVICE_NOT_READY_MESSAGE } from "./provider.server";
import { ExternalAnalysisError, type ExternalAnalysisProvider, type ExternalAnalysisRequest } from "./types";

export type ExternalAnalysisInput = {
  image: { bytes: Uint8Array; mimeType: string };
  asset?: string | null;
  timeframe?: string | null;
  market?: string | null;
};

const clean = (v: string | null | undefined) => (v && v.trim() ? v.trim().slice(0, 40) : null);

export function isExternalAnalysisReady(provider = getExternalAnalysisProvider()) {
  return provider.isConfigured();
}

export function buildExternalAnalysisRequest(input: ExternalAnalysisInput): ExternalAnalysisRequest {
  const { bytes, mimeType } = input.image;
  if (!ACCEPTED_TYPES.includes(mimeType)) {
    throw new ExternalAnalysisError("invalid_request", "Format non accepté. Utilise une image JPG, JPEG, PNG ou WEBP.");
  }
  if (bytes.length === 0) throw new ExternalAnalysisError("invalid_request", "Image vide.");
  if (bytes.length > MAX_FILE_SIZE) {
    throw new ExternalAnalysisError("invalid_request", "L'image est trop grande (8 Mo maximum).");
  }
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return {
    image: {
      dataUrl: `data:${mimeType};base64,${btoa(bin)}`,
      mimeType: mimeType as ExternalAnalysisRequest["image"]["mimeType"],
      sizeBytes: bytes.length,
    },
    asset: clean(input.asset),
    timeframe: clean(input.timeframe),
    market: clean(input.market),
    instructions: CHARTAI_ANALYSIS_RULES,
  };
}

function assertResult(r: unknown): asserts r is AnalysisResult {
  const o = r as Partial<AnalysisResult> | null;
  if (!o || typeof o !== "object" || typeof o.is_chart !== "boolean" || typeof o.image_readable !== "boolean" || typeof o.summary !== "string") {
    throw new ExternalAnalysisError("invalid_response", "La réponse du service d'analyse est invalide.");
  }
}

export async function runExternalAnalysis(
  input: ExternalAnalysisInput,
  provider: ExternalAnalysisProvider = getExternalAnalysisProvider(),
): Promise<AnalysisResult> {
  if (!provider.isConfigured()) throw new ExternalAnalysisError("not_configured", SERVICE_NOT_READY_MESSAGE);
  const request = buildExternalAnalysisRequest(input);
  const result = await provider.analyze(request);
  assertResult(result);
  return result;
}
