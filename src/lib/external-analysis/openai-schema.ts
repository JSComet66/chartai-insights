// JSON Schema (strict) for OpenAI structured output + server-side validator/mapper to AnalysisResult.
import type {
  AnalysisResult,
  ConvictionFactor,
  DirectionalScenario,
  Indicator,
  Level,
  NeutralScenario,
  TemporalConfirmation,
} from "../analysis-types";

const str = { type: "string" } as const;
const nStr = { type: ["string", "null"] } as const;
const nNum = { type: ["number", "null"] } as const;
const obj = (properties: Record<string, unknown>) => ({
  type: "object",
  additionalProperties: false,
  properties,
  required: Object.keys(properties),
});
const nullable = (o: object) => ({ anyOf: [o, { type: "null" }] });

const level = obj({ level: str, importance: { type: "string", enum: ["faible", "moyenne", "forte"] }, explanation: str });
const directional = obj({ conditions: str, invalidation: str, supporting_elements: str });
const factor = obj({ label: str, kind: { type: "string", enum: ["positive", "warning"] } });

export const ANALYSIS_JSON_SCHEMA = obj({
  is_chart: { type: "boolean" },
  image_readable: { type: "boolean" },
  asset_detected: nStr,
  timeframe_detected: nStr,
  market_detected: nStr,
  summary: str,
  trend: { type: "string", enum: ["haussière", "baissière", "neutre", "indéterminée"] },
  market_structure: str,
  trend_explanation: str,
  supports: { type: "array", items: level },
  resistances: { type: "array", items: level },
  indicators: { type: "array", items: obj({ name: str, values: nStr, interpretation: str }) },
  bullish_scenario: nullable(directional),
  bearish_scenario: nullable(directional),
  neutral_scenario: nullable(obj({ conditions: str, breakout_confirmation: str })),
  risk_notes: str,
  risk_reward: nStr,
  analysis_quality: { type: "string", enum: ["Faible", "Moyenne", "Élevée"] },
  quality_explanation: str,
  bullish_conviction: { type: "integer" },
  bearish_conviction: { type: "integer" },
  data_quality: { type: "string", enum: ["low", "medium", "high"] },
  bullish_factors: { type: "array", items: factor },
  bearish_factors: { type: "array", items: factor },
  conviction_explanation: str,
  temporal_confirmations: {
    type: "array",
    items: obj({
      zone_low: nNum,
      zone_high: nNum,
      zone_label: str,
      observation_window_min: nNum,
      observation_window_max: nNum,
      time_unit: { type: "string", enum: ["secondes", "minutes", "heures", "jours"] },
      scenario: { type: "string", enum: ["bullish", "bearish", "neutral"] },
      confirmation_condition: str,
      invalidation_condition: str,
      explanation: str,
    }),
  },
  temporal_undetermined_reason: nStr,
});

// ---------- validation ----------
class Invalid extends Error {}
type R = Record<string, unknown>;
const isObj = (v: unknown): v is R => !!v && typeof v === "object" && !Array.isArray(v);
const s = (v: unknown, max = 4000): string => {
  if (typeof v !== "string") throw new Invalid();
  return v.slice(0, max);
};
const ns = (v: unknown, max = 200): string | null => (v === null || v === undefined ? null : s(v, max));
const nn = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[]): T => {
  if (!allowed.includes(v as T)) throw new Invalid();
  return v as T;
};
const arr = <T>(v: unknown, map: (x: unknown) => T, max = 12): T[] => {
  if (!Array.isArray(v)) throw new Invalid();
  return v.slice(0, max).map(map);
};
const o = (v: unknown): R => {
  if (!isObj(v)) throw new Invalid();
  return v;
};
const score = (v: unknown) => {
  if (typeof v !== "number" || !Number.isFinite(v)) throw new Invalid();
  return Math.max(0, Math.min(100, Math.round(v)));
};

const mapLevel = (x: unknown): Level => {
  const l = o(x);
  return { level: s(l.level, 100), importance: oneOf(l.importance, ["faible", "moyenne", "forte"] as const), explanation: s(l.explanation) };
};
const mapIndicator = (x: unknown): Indicator => {
  const i = o(x);
  return { name: s(i.name, 120), values: ns(i.values, 300), interpretation: s(i.interpretation) };
};
const mapDir = (x: unknown): DirectionalScenario | null => {
  if (x === null) return null;
  const d = o(x);
  return { conditions: s(d.conditions), invalidation: s(d.invalidation), supporting_elements: s(d.supporting_elements) };
};
const mapNeutral = (x: unknown): NeutralScenario | null => {
  if (x === null) return null;
  const d = o(x);
  return { conditions: s(d.conditions), breakout_confirmation: s(d.breakout_confirmation) };
};
const mapFactor = (x: unknown): ConvictionFactor => {
  const f = o(x);
  return { label: s(f.label, 300), kind: oneOf(f.kind, ["positive", "warning"] as const) };
};
const mapTemporal = (x: unknown): TemporalConfirmation => {
  const t = o(x);
  return {
    zone_low: nn(t.zone_low),
    zone_high: nn(t.zone_high),
    zone_label: s(t.zone_label, 200),
    observation_window_min: nn(t.observation_window_min),
    observation_window_max: nn(t.observation_window_max),
    time_unit: oneOf(t.time_unit, ["secondes", "minutes", "heures", "jours"] as const),
    scenario: oneOf(t.scenario, ["bullish", "bearish", "neutral"] as const),
    confirmation_condition: s(t.confirmation_condition),
    invalidation_condition: s(t.invalidation_condition),
    explanation: s(t.explanation),
  };
};

/** Returns a validated AnalysisResult, or null if the payload is invalid/incomplete. */
export function parseAnalysisResult(raw: unknown): AnalysisResult | null {
  try {
    const r = o(raw);
    if (typeof r.is_chart !== "boolean" || typeof r.image_readable !== "boolean") return null;
    return {
      is_chart: r.is_chart,
      image_readable: r.image_readable,
      asset_detected: ns(r.asset_detected, 40),
      timeframe_detected: ns(r.timeframe_detected, 40),
      market_detected: ns(r.market_detected, 40),
      summary: s(r.summary),
      trend: oneOf(r.trend, ["haussière", "baissière", "neutre", "indéterminée"] as const),
      market_structure: s(r.market_structure),
      trend_explanation: s(r.trend_explanation),
      supports: arr(r.supports, mapLevel),
      resistances: arr(r.resistances, mapLevel),
      indicators: arr(r.indicators, mapIndicator),
      bullish_scenario: mapDir(r.bullish_scenario),
      bearish_scenario: mapDir(r.bearish_scenario),
      neutral_scenario: mapNeutral(r.neutral_scenario),
      risk_notes: s(r.risk_notes),
      risk_reward: ns(r.risk_reward, 500),
      analysis_quality: oneOf(r.analysis_quality, ["Faible", "Moyenne", "Élevée"] as const),
      quality_explanation: s(r.quality_explanation),
      bullish_conviction: score(r.bullish_conviction),
      bearish_conviction: score(r.bearish_conviction),
      data_quality: oneOf(r.data_quality, ["low", "medium", "high"] as const),
      bullish_factors: arr(r.bullish_factors, mapFactor),
      bearish_factors: arr(r.bearish_factors, mapFactor),
      conviction_explanation: s(r.conviction_explanation),
      temporal_confirmations: arr(r.temporal_confirmations, mapTemporal, 3),
      temporal_undetermined_reason: ns(r.temporal_undetermined_reason, 1000),
    };
  } catch {
    return null;
  }
}
