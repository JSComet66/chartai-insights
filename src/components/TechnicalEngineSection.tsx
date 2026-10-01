import { useQuery } from "@tanstack/react-query";
import { Cpu, Loader2 } from "lucide-react";
import type { AnalysisResult } from "@/lib/analysis-types";
import { extractCandles, loadImageData } from "@/lib/technical-engine/extract";
import { runTechnicalEngine } from "@/lib/technical-engine/engine";
import type { TechnicalEngineResult } from "@/lib/technical-engine/types";

const TREND_FR: Record<TechnicalEngineResult["trend"], string> = {
  bullish: "haussière", bearish: "baissière", neutral: "neutre", undetermined: "indéterminée",
};

function List({ title, items, empty = "Aucun" }: { title: string; items: string[]; empty?: string }) {
  return (
    <div>
      <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h4>
      {items.length ? (
        <ul className="mt-2 space-y-1 text-sm">{items.map((i) => <li key={i}>• {i}</li>)}</ul>
      ) : <p className="mt-2 text-sm text-muted-foreground">{empty}</p>}
    </div>
  );
}

export function TechnicalEngineSection({ imageUrl, ai, analysisId }: { imageUrl: string | null; ai: AnalysisResult; analysisId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["technical-engine", analysisId],
    enabled: !!imageUrl,
    staleTime: Infinity,
    queryFn: async () => runTechnicalEngine(extractCandles(await loadImageData(imageUrl!)).candles),
  });

  return (
    <section className="mt-10 rounded-xl border border-dashed bg-card/40 p-5">
      <div className="flex items-center gap-2">
        <Cpu className="h-4 w-4 text-info" />
        <h2 className="text-lg font-semibold">Analyse technique ChartAI</h2>
        <span className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">moteur déterministe · expérimental</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Calculée par des règles mathématiques sur les bougies lues dans l'image, sans IA, séparément de l'analyse GPT.
        Le score mesure la cohérence des signaux détectés, pas une probabilité de hausse ou de baisse.
      </p>

      {isLoading && <p className="mt-4 flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Calcul en cours…</p>}
      {(error || !imageUrl) && <p className="mt-4 text-sm text-destructive">Impossible de lire l'image pour le moteur technique.</p>}

      {data && (
        <div className="mt-5 space-y-6">
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Tendance détectée" value={TREND_FR[data.trend]} />
            <Stat label="Score technique" value={data.technical_score === null ? "—" : `${data.technical_score}/100`} />
            <Stat label="Confiance du moteur" value={`${data.confidence}/100`} />
            <Stat label="Données disponibles" value={`${data.data_quality}/100`} sub={`${data.candles_detected} bougies`} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1">Comparaison</th><th>Analyse IA</th><th>Moteur ChartAI</th></tr></thead>
              <tbody className="[&_td]:border-t [&_td]:py-2">
                <tr><td>Tendance</td><td>{ai.trend}</td><td>{TREND_FR[data.trend]}</td></tr>
                <tr><td>Conviction / score</td><td>{ai.bullish_conviction ?? "—"} haussière · {ai.bearish_conviction ?? "—"} baissière</td><td>{data.technical_score ?? "—"} (50 = neutre)</td></tr>
                <tr><td>Supports / résistances</td><td>{ai.supports.length} / {ai.resistances.length}</td><td>{data.support_levels.length} / {data.resistance_levels.length}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <List title="Supports (en % de la plage visible)" items={data.support_levels.map((l) => `${l.label} · ${l.touches} contacts`)} />
            <List title="Résistances (en % de la plage visible)" items={data.resistance_levels.map((l) => `${l.label} · ${l.touches} contacts`)} />
            <List title="Signaux haussiers" items={data.bullish_factors} />
            <List title="Signaux baissiers" items={data.bearish_factors} />
            <List title="Signaux contradictoires" items={data.contradictory_signals} />
            <List title="Cassures et rejets" items={[...data.breakouts, ...data.rejections]} />
            <List title="Conditions de confirmation" items={data.confirmation_conditions} />
            <List title="Conditions d'invalidation" items={data.invalidation_conditions} />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Indicateurs calculés</h4>
              <ul className="mt-2 space-y-1 text-sm">
                <li>Structure : {data.structure}</li>
                <li>RSI 14 : {data.rsi === null ? "non calculable" : data.rsi.toFixed(0)}</li>
                <li>MM20 : {data.ma_fast === null ? "non calculable" : `${data.ma_fast.toFixed(1)} %`} · MM50 : {data.ma_slow === null ? "non calculable" : `${data.ma_slow.toFixed(1)} %`}</li>
                <li>Volume : non disponible</li>
              </ul>
            </div>
            <List title="Données manquantes" items={data.missing_data} />
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold capitalize">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
