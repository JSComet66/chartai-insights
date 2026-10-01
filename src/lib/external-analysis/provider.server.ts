// Server-only: provider selection. No provider is connected yet.
// Future provider: implement ExternalAnalysisProvider and return it from
// getExternalAnalysisProvider(). Its secret must be read server-side only,
// inside the call, from process.env["EXTERNAL_AI_API_KEY"] (not set yet).
import { ExternalAnalysisError, type ExternalAnalysisProvider } from "./types";

export const EXTERNAL_AI_API_KEY_ENV = "EXTERNAL_AI_API_KEY";
export const SERVICE_NOT_READY_MESSAGE = "Service d’analyse IA en préparation.";

/** Placeholder adapter: never performs any network request. */
export const unconfiguredProvider: ExternalAnalysisProvider = {
  id: "unconfigured",
  isConfigured: () => false,
  analyze: async () => {
    throw new ExternalAnalysisError("not_configured", SERVICE_NOT_READY_MESSAGE);
  },
};

export function getExternalAnalysisProvider(): ExternalAnalysisProvider {
  return unconfiguredProvider;
}
