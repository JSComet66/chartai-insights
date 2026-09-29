// Browser-only: deterministic pixel extraction of candlesticks from a chart screenshot.
// No AI involved. Values are relative (0 = bottom of detected price range, 100 = top).
import type { Candle } from "./types";

const MAX_W = 1400;

function isGreen(r: number, g: number, b: number) {
  return g > 90 && g - r > 40 && g - b > 10;
}
function isRed(r: number, g: number, b: number) {
  return r > 110 && r - g > 50 && r - b > 30;
}

export async function loadImageData(url: string): Promise<ImageData> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  await img.decode();
  const scale = Math.min(1, MAX_W / img.naturalWidth);
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas indisponible");
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

type Col = { top: number; bottom: number; green: number; red: number; rows: Map<number, number> } | null;

/** Extract candles in pixel space, then normalise to 0–100. */
export function extractCandles(data: ImageData): { candles: Candle[]; imageWidth: number; imageHeight: number } {
  const { width: W, height: H, data: px } = data;
  // Ignore right price axis (~7%) and top header (~5%) to limit label noise.
  const xMax = Math.floor(W * 0.93);
  const yMin = Math.floor(H * 0.05);
  const cols: Col[] = [];
  for (let x = 0; x < xMax; x++) {
    // Collect coloured pixel runs; keep the topmost segment (volume panel usually sits below).
    let top = -1, bottom = -1, green = 0, red = 0, lastY = -100;
    const rows = new Map<number, number>();
    for (let y = yMin; y < H; y++) {
      const i = (y * W + x) * 4;
      const r = px[i]!, g = px[i + 1]!, b = px[i + 2]!;
      const gr = isGreen(r, g, b), rd = isRed(r, g, b);
      if (!gr && !rd) continue;
      if (top >= 0 && y - lastY > 8) break; // gap → end of first segment
      if (top < 0) top = y;
      bottom = y;
      lastY = y;
      if (gr) green++; else red++;
      rows.set(y, 1);
    }
    cols.push(top < 0 ? null : { top, bottom, green, red, rows });
  }

  // Group consecutive coloured columns into candles.
  const raw: { high: number; low: number; open: number; close: number; bull: boolean; x: number }[] = [];
  let x = 0;
  while (x < cols.length) {
    if (!cols[x]) { x++; continue; }
    const start = x;
    while (x < cols.length && cols[x]) x++;
    const group = cols.slice(start, x) as NonNullable<Col>[];
    if (group.length > 40) continue; // too wide → probably not a candle (indicator fill, banner)
    const high = Math.min(...group.map((c) => c.top));
    const low = Math.max(...group.map((c) => c.bottom));
    const green = group.reduce((s, c) => s + c.green, 0);
    const red = group.reduce((s, c) => s + c.red, 0);
    const bull = green >= red;
    // Body = rows covered by ≥60% of group columns.
    const counts = new Map<number, number>();
    for (const c of group) for (const y of c.rows.keys()) counts.set(y, (counts.get(y) ?? 0) + 1);
    const need = Math.max(1, Math.ceil(group.length * 0.6));
    const bodyRows = [...counts.entries()].filter(([, n]) => n >= need).map(([y]) => y);
    const bTop = bodyRows.length ? Math.min(...bodyRows) : high;
    const bBot = bodyRows.length ? Math.max(...bodyRows) : low;
    raw.push({ high, low, open: bull ? bBot : bTop, close: bull ? bTop : bBot, bull, x: (start + x) / 2 });
  }

  if (!raw.length) return { candles: [], imageWidth: W, imageHeight: H };
  // Normalise: pixel y → 0..100 (inverted axis).
  const yTop = Math.min(...raw.map((c) => c.high));
  const yBot = Math.max(...raw.map((c) => c.low));
  const span = Math.max(1, yBot - yTop);
  const n = (y: number) => ((yBot - y) / span) * 100;
  const candles = raw.map((c) => ({ x: c.x, high: n(c.high), low: n(c.low), open: n(c.open), close: n(c.close), bullish: c.bull }));
  return { candles, imageWidth: W, imageHeight: H };
}
