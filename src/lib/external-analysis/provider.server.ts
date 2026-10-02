// Server-only: provider composition. Swap the adapter here; the frontend never changes.
import { createOpenAIResponsesProvider, OPENAI_NOT_CONFIGURED_MESSAGE } from "./openai-responses.provider.server";
import type { ExternalAnalysisProvider } from "./types";

export const SERVICE_NOT_READY_MESSAGE = OPENAI_NOT_CONFIGURED_MESSAGE;

export function getExternalAnalysisProvider(): ExternalAnalysisProvider {
  return createOpenAIResponsesProvider();
}
