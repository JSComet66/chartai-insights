// Server-side contracts for the external (provider-agnostic) chart analysis.
import type { AnalysisResult } from "../analysis-types";

/** Normalised request handed to a provider. */
export type ExternalAnalysisRequest = {
  image: {
    /** data:<mime>;base64,... */
    dataUrl: string;
    mimeType: "image/jpeg" | "image/png" | "image/webp";
    sizeBytes: number;
  };
  asset: string | null;
  timeframe: string | null;
  market: string | null;
  /** Centralised ChartAI educational rules (French) the provider must apply. */
  instructions: string;
};

/** Adapter contract every future provider must implement. */
export interface ExternalAnalysisProvider {
  readonly id: string;
  isConfigured(): boolean;
  analyze(request: ExternalAnalysisRequest, signal?: AbortSignal): Promise<AnalysisResult>;
}

export type ExternalAnalysisErrorCode =
  | "not_configured"
  | "invalid_request"
  | "provider_unavailable"
  | "invalid_response";

export class ExternalAnalysisError extends Error {
  constructor(public code: ExternalAnalysisErrorCode, message: string) {
    super(message);
  }
}
