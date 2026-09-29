// Pure, deterministic rules engine. Input: candles in relative units (0–100 of visible range).
import type { Candle, EngineLevel, TechnicalEngineResult } from "./types";

const f = (v: number) => `${v.toFixed(1)} %`;

function sma(v: number[], p: number) {
  if (v.length < p) return null;
  return v.slice(-p).reduce((a, b) => a + b, 0) / p;
}

function rsi(closes: number[], p = 14) {
  if (closes.length < p + 1) return null;
  let gain = 0, loss = 0;
  for (let i = 1; i <= p; i++) {
    const d = closes[i]! - closes[i - 1]!;
    if (d > 0) gain += d; else loss -= d;
  }
  gain /= p; loss /= p;
  for (let i = p + 1; i < closes.length; i++) {
    const d = closes[i]! - closes[i - 1]!;
    gain = (gain * (p - 1) + Math.max(d, 0)) / p;
    loss = (loss * (p - 1) + Math.max(-d, 0)) / p;
  }
  if (loss === 0) return 100;
  return 100 - 100 / (1 + gain / loss);
}

function slope(v: number[]) {
  const n = v.length;
  const mx = (n - 1) / 2, my = v.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  v.forEach((y, x) => { num += (x - mx) * (y - my); den += (x - mx) ** 2; });
  return den ? num / den : 0;
}

function pivots(c: Candle[], w = 3) {
  const highs: number[] = [], lows: number[] = [];
  for (let i = w; i < c.length - w; i++) {
    const win = c.slice(i - w, i + w + 1);
    if (c[i]!.high === Math.max(...win.map((k) => k.high))) highs.push(i);
    if (c[i]!.low === Math.min(...win.map((k) => k.low))) lows.push(i);
  }
  return { highs, lows };
}

function cluster(values: number[], tol = 2.5): EngineLevel[] {
  const sorted = [...values].sort((a, b) => a - b);
  const out: { sum: number; n: number }[] = [];
  for (const v of sorted) {
    const last = out[out.length - 1];
    if (last && Math.abs(last.sum / last.n - v) <= tol) { last.sum += v; last.n++; }
    else out.push({ sum: v, n: 1 });
  }
  return out.map((g) => ({ level: g.sum / g.n, touches: g.n, label: `≈ ${f(g.sum / g.n)} de la plage visible` }));
}

export function runTechnicalEngine(candles: Candle[]): TechnicalEngineResult {
  const n = candles.length;
  const missing = [
    "Prix réels (l'axe des prix n'est pas lu : niveaux exprimés en % de la plage visible)",
    "Volume (non extrait de la capture)",
    "Horodatage des bougies / timeframe réel",
  ];
  const availability = [
    { name: "Bougies (OHLC relatif)", available: n >= 20, note: `${n} bougies détectées par lecture des pixels` },
    { name: "RSI 14", available: n >= 15, note: "Calculé sur les clôtures relatives (échelle linéaire supposée)" },
    { name: "Moyennes mobiles 20 / 50", available: n >= 50 ? true : n >= 20, note: n >= 50 ? "MM20 et MM50" : n >= 20 ? "MM20 seulement" : "Pas assez de bougies" },
    { name: "Volume", available: false, note: "Non disponible" },
    { name: "Prix absolus", available: false, note: "Non disponible (pas de lecture de l'axe)" },
  ];
  const base: TechnicalEngineResult = {
    engine_version: "1.0.0", trend: "undetermined", bullish_factors: [], bearish_factors: [], contradictory_signals: [],
    support_levels: [], resistance_levels: [], consolidation: { detected: false, low: null, high: null, candles: 0 },
    breakouts: [], rejections: [], structure: "Indéterminée", rsi: null, ma_fast: null, ma_slow: null, volume: null,
    technical_score: null, confidence: 0, confirmation_conditions: [], invalidation_conditions: [],
    data_quality: Math.min(100, Math.round((n / 80) * 100)), candles_detected: n, data_availability: availability, missing_data: missing,
  };
  if (n < 20) {
    base.missing_data.unshift("Nombre de bougies insuffisant (minimum 20) : graphique en ligne, capture trop petite ou couleurs non standard");
    return base;
  }

  const closes = candles.map((c) => c.close);
  const last = candles[n - 1]!;
  const bull: string[] = [], bear: string[] = [], contra: string[] = [];
  let score = 0;

  // 1. Short-term trend (regression on last 20 closes).
  const s = slope(closes.slice(-20)); // % of range per candle
  const trendPts = Math.max(-15, Math.min(15, s * 10));
  score += trendPts;
  if (s > 0.3) bull.push(`Pente court terme positive (${s.toFixed(2)} %/bougie)`);
  else if (s < -0.3) bear.push(`Pente court terme négative (${s.toFixed(2)} %/bougie)`);

  // 2. Structure (swing highs/lows).
  const { highs, lows } = pivots(candles);
  const lastH = highs.slice(-2).map((i) => candles[i]!.high);
  const lastL = lows.slice(-2).map((i) => candles[i]!.low);
  let structure = "Structure indéterminée (pas assez de sommets/creux)";
  if (lastH.length === 2 && lastL.length === 2) {
    const hh = lastH[1]! > lastH[0]!, hl = lastL[1]! > lastL[0]!;
    if (hh && hl) { structure = "Sommets et creux ascendants"; bull.push(structure); score += 15; }
    else if (!hh && !hl) { structure = "Sommets et creux descendants"; bear.push(structure); score -= 15; }
    else { structure = hh ? "Sommet plus haut mais creux plus bas (expansion)" : "Sommet plus bas mais creux plus haut (compression)"; contra.push(structure); }
  }

  // 3. Supports / resistances from pivot clusters.
  const levels = cluster([...highs.map((i) => candles[i]!.high), ...lows.map((i) => candles[i]!.low)])
    .filter((l) => l.touches >= 2);
  const supports = levels.filter((l) => l.level < last.close).sort((a, b) => b.level - a.level).slice(0, 3);
  const resistances = levels.filter((l) => l.level > last.close).sort((a, b) => a.level - b.level).slice(0, 3);

  // 4. Consolidation: longest recent window with range < 15 %.
  let consN = 0, cLo = 0, cHi = 0;
  for (let k = 8; k <= n; k++) {
    const w = candles.slice(-k);
    const hi = Math.max(...w.map((c) => c.high)), lo = Math.min(...w.map((c) => c.low));
    if (hi - lo < 15) { consN = k; cLo = lo; cHi = hi; } else break;
  }
  const consolidation = { detected: consN >= 8, low: consN ? cLo : null, high: consN ? cHi : null, candles: consN };
  if (consolidation.detected) contra.push(`Consolidation sur les ${consN} dernières bougies (${f(cLo)} – ${f(cHi)})`);

  // 5. Breakouts vs prior 20-candle range (excluding last 3).
  const breakouts: string[] = [];
  if (n >= 25) {
    const prior = candles.slice(-23, -3);
    const pHi = Math.max(...prior.map((c) => c.high)), pLo = Math.min(...prior.map((c) => c.low));
    if (last.close > pHi) { breakouts.push(`Cassure potentielle haussière au-dessus de ${f(pHi)}`); bull.push("Clôture au-dessus du range précédent"); score += 12; }
    if (last.close < pLo) { breakouts.push(`Cassure potentielle baissière sous ${f(pLo)}`); bear.push("Clôture sous le range précédent"); score -= 12; }
  }

  // 6. Rejections: long wicks on last 5 candles near a level.
  const rejections: string[] = [];
  for (const c of candles.slice(-5)) {
    const body = Math.max(0.3, Math.abs(c.close - c.open));
    const upper = c.high - Math.max(c.open, c.close), lower = Math.min(c.open, c.close) - c.low;
    const near = (v: number) => levels.find((l) => Math.abs(l.level - v) <= 3);
    if (upper > 2 * body && near(c.high)) { rejections.push(`Rejet par le haut près de ${f(near(c.high)!.level)}`); score -= 4; }
    if (lower > 2 * body && near(c.low)) { rejections.push(`Rejet par le bas près de ${f(near(c.low)!.level)}`); score += 4; }
  }
  if (rejections.some((r) => r.includes("haut"))) bear.push("Mèche(s) de rejet sur résistance");
  if (rejections.some((r) => r.includes("bas"))) bull.push("Mèche(s) de rejet sur support");

  // 7. RSI.
  const r = rsi(closes);
  if (r !== null) {
    if (r > 70) { contra.push(`RSI en zone de surachat (${r.toFixed(0)})`); score -= 3; }
    else if (r < 30) { contra.push(`RSI en zone de survente (${r.toFixed(0)})`); score += 3; }
    else if (r > 55) { bull.push(`RSI au-dessus de 55 (${r.toFixed(0)})`); score += 6; }
    else if (r < 45) { bear.push(`RSI sous 45 (${r.toFixed(0)})`); score -= 6; }
  }

  // 8. Moving averages.
  const m20 = sma(closes, 20), m50 = sma(closes, 50);
  if (m20 !== null) {
    if (last.close > m20) { bull.push("Clôture au-dessus de la MM20"); score += 6; } else { bear.push("Clôture sous la MM20"); score -= 6; }
  }
  if (m20 !== null && m50 !== null) {
    if (m20 > m50) { bull.push("MM20 au-dessus de la MM50"); score += 8; } else { bear.push("MM20 sous la MM50"); score -= 8; }
  }

  if (bull.length && bear.length) contra.push(`${bull.length} signal(s) haussier(s) et ${bear.length} baissier(s) coexistent`);

  const technical = Math.round(Math.max(0, Math.min(100, 50 + score)));
  const trend = technical >= 60 ? "bullish" : technical <= 40 ? "bearish" : "neutral";
  const agreement = Math.abs(bull.length - bear.length) / Math.max(1, bull.length + bear.length);
  const confidence = Math.round(base.data_quality * (0.4 + 0.6 * agreement));

  const s1 = supports[0], r1 = resistances[0];
  const confirmation: string[] = [], invalidation: string[] = [];
  if (r1) confirmation.push(`Scénario haussier renforcé par une clôture au-dessus de ${f(r1.level)}`);
  if (s1) confirmation.push(`Scénario baissier renforcé par une clôture sous ${f(s1.level)}`);
  if (trend === "bullish" && s1) invalidation.push(`Lecture haussière invalidée sous ${f(s1.level)}`);
  if (trend === "bearish" && r1) invalidation.push(`Lecture baissière invalidée au-dessus de ${f(r1.level)}`);
  if (trend === "neutral" && consolidation.detected) invalidation.push(`Neutralité invalidée par une sortie nette de ${f(cLo)} – ${f(cHi)}`);
  if (!confirmation.length) confirmation.push("Aucun niveau suffisamment testé pour formuler une condition");

  return {
    ...base, trend, bullish_factors: bull, bearish_factors: bear, contradictory_signals: contra,
    support_levels: supports, resistance_levels: resistances, consolidation, breakouts, rejections, structure,
    rsi: r, ma_fast: m20, ma_slow: m50, technical_score: technical, confidence,
    confirmation_conditions: confirmation, invalidation_conditions: invalidation,
    missing_data: m50 === null ? [...missing, "Moins de 50 bougies : MM50 non calculable"] : missing,
  };
}
