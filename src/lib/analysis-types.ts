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
  // Conviction technique (absent on older analyses)
  bullish_conviction?: number;
  bearish_conviction?: number;
  data_quality?: "low" | "medium" | "high";
  bullish_factors?: ConvictionFactor[];
  bearish_factors?: ConvictionFactor[];
  conviction_explanation?: string;
  // Confirmation temporelle (absent on older analyses)
  temporal_confirmations?: TemporalConfirmation[];
  temporal_undetermined_reason?: string | null;
};

export type ConvictionFactor = { label: string; kind: "positive" | "warning" };

export type TemporalConfirmation = {
  zone_low: number | null;
  zone_high: number | null;
  zone_label: string;
  observation_window_min: number | null;
  observation_window_max: number | null;
  time_unit: "secondes" | "minutes" | "heures" | "jours";
  scenario: "bullish" | "bearish" | "neutral";
  confirmation_condition: string;
  invalidation_condition: string;
  explanation: string;
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
