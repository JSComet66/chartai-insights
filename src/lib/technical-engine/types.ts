// Types for the deterministic ChartAI technical engine (kept separate from AI analysis types).

export type Candle = { x: number; open: number; high: number; low: number; close: number; bullish: boolean };

export type EngineLevel = { level: number; touches: number; label: string };

export type DataAvailability = { name: string; available: boolean; note: string };

export type TechnicalEngineResult = {
  engine_version: string;
  trend: "bullish" | "bearish" | "neutral" | "undetermined";
  bullish_factors: string[];
  bearish_factors: string[];
  contradictory_signals: string[];
  support_levels: EngineLevel[];
  resistance_levels: EngineLevel[];
  consolidation: { detected: boolean; low: number | null; high: number | null; candles: number };
  breakouts: string[];
  rejections: string[];
  structure: string;
  rsi: number | null;
  ma_fast: number | null;
  ma_slow: number | null;
  volume: null;
  technical_score: number | null; // 0–100, 50 = neutre. Cohérence des signaux, PAS une probabilité.
  confidence: number; // 0–100
  confirmation_conditions: string[];
  invalidation_conditions: string[];
  data_quality: number; // 0–100
  candles_detected: number;
  data_availability: DataAvailability[];
  missing_data: string[];
};
