// Server-only: placeholder for the future independent AI analysis backend.
// No AI provider is connected for now; plug the new backend in here.
import type { AnalysisResult } from "./analysis-types";

export class ChartAIError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

export const ANALYSIS_UNAVAILABLE_MESSAGE =
  "Analyse bientôt disponible : le service d'analyse est en cours de préparation.";

export async function analyzeChartImage(_input: {
  imageUrl: string;
  asset?: string | null | undefined;
  timeframe?: string | null | undefined;
  market?: string | null | undefined;
}): Promise<AnalysisResult> {
  throw new ChartAIError(ANALYSIS_UNAVAILABLE_MESSAGE, 503);
}
