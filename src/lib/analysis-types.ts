// Shared (browser-safe) types and constants for chart analyses.

export const TIMEFRAMES = ["1 min", "5 min", "15 min", "1 h", "4 h", "1 jour", "1 semaine"] as const;
export const MARKETS = ["Crypto", "Forex", "Actions", "Indices", "Autre"] as const;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 Mo

export type Level = { level: string; importance: "faible" | "moyenne" | "forte"; explanation: string };
export type Indicator = { name: string; values: string | null; interpretation: string };
export type DirectionalScenario = {
  conditions: string;
  invalidation: string;
  supporting_elements: string;
};
export type NeutralScenario = { conditions: string; breakout_confirmation: string };

export type AnalysisResult = {
  is_chart: boolean;
  image_readable: boolean;
  asset_detected: string | null;
  timeframe_detected: string | null;
  market_detected: string | null;
  summary: string;
  trend: "haussière" | "baissière" | "neutre" | "indéterminée";
  market_structure: string;
  trend_explanation: string;
  supports: Level[];
  resistances: Level[];
  indicators: Indicator[];
  bullish_scenario: DirectionalScenario | null;
  bearish_scenario: DirectionalScenario | null;
  neutral_scenario: NeutralScenario | null;
  risk_notes: string;
  risk_reward: string | null;
  analysis_quality: "Faible" | "Moyenne" | "Élevée";
  quality_explanation: string;
};

export type AnalysisRow = {
  id: string;
  user_id: string;
  image_url: string;
  asset: string | null;
  timeframe: string | null;
  market: string | null;
  analysis_result: AnalysisResult;
  created_at: string;
};
