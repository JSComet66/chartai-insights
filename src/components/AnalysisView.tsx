import type { ReactNode } from "react";
import { AlertTriangle, TrendingUp, TrendingDown, Minus, HelpCircle } from "lucide-react";
import type { AnalysisRow, AnalysisResult, Level } from "@/lib/analysis-types";

const trendStyle: Record<AnalysisResult["trend"], { cls: string; Icon: typeof TrendingUp; label: string }> = {
  haussière: { cls: "text-bullish bg-bullish/10 border-bullish/30", Icon: TrendingUp, label: "Haussière" },
  baissière: { cls: "text-bearish bg-bearish/10 border-bearish/30", Icon: TrendingDown, label: "Baissière" },
  neutre: { cls: "text-info bg-info/10 border-info/30", Icon: Minus, label: "Neutre" },
  indéterminée: { cls: "text-muted-foreground bg-muted border-border", Icon: HelpCircle, label: "Indéterminée" },
};

export function TrendBadge({ trend }: { trend: AnalysisResult["trend"] }) {
  const s = trendStyle[trend] ?? trendStyle["indéterminée"];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${s.cls}`}>
      <s.Icon className="h-3 w-3" /> {s.label}
    </span>
  );
}

function Section({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border bg-card p-5 ${className}`}>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Quality({ q, text }: { q: AnalysisResult["analysis_quality"]; text: string }) {
  const n = q === "Élevée" ? 3 : q === "Moyenne" ? 2 : 1;
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Qualité de l'analyse</span>
        <span className="text-sm font-semibold text-info">{q}</span>
      </div>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3].map((i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= n ? "bg-info" : "bg-muted"}`} />)}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{text}</p>
      <p className="mt-1 text-[11px] text-muted-foreground/70">Reflète uniquement la lisibilité de la capture, pas une probabilité de gain.</p>
    </div>
  );
}

const importanceCls = { faible: "text-muted-foreground", moyenne: "text-warning", forte: "text-primary" };

function Levels({ items, kind }: { items: Level[]; kind: "Support" | "Résistance" }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">Aucun niveau suffisamment visible.</p>;
  return (
    <ul className="space-y-3">
      {items.map((l, i) => (
        <li key={i} className="rounded-lg border bg-surface p-3">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className={kind === "Support" ? "text-bullish" : "text-bearish"}>{kind}</span>
            <span className="font-mono font-medium">{l.level}</span>
          </div>
          <p className="mt-1 text-xs">Importance : <span className={importanceCls[l.importance]}>{l.importance}</span></p>
          <p className="mt-1 text-sm text-muted-foreground">{l.explanation}</p>
        </li>
      ))}
    </ul>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}

export function AnalysisView({ row, imageUrl }: { row: AnalysisRow; imageUrl: string | null }) {
  const r = row.analysis_result;
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-xl border bg-card p-2">
          {imageUrl ? (
            <a href={imageUrl} target="_blank" rel="noreferrer">
              <img src={imageUrl} alt="Graphique original" className="w-full rounded-lg object-contain" />
            </a>
          ) : <div className="aspect-video rounded-lg bg-surface" />}
        </div>
        <div className="rounded-xl border bg-card p-5"><Quality q={r.analysis_quality} text={r.quality_explanation} /></div>
      </div>

      <div className="space-y-4">
        <Section title="Résumé">
          <dl className="grid grid-cols-3 gap-4">
            <Field label="Actif" value={row.asset || "Non détecté"} />
            <Field label="Timeframe" value={row.timeframe || "Non détectée"} />
            <Field label="Marché" value={row.market || "Non précisé"} />
          </dl>
          <p className="mt-4 text-sm leading-relaxed">{r.summary}</p>
        </Section>

        <Section title="Tendance">
          <TrendBadge trend={r.trend} />
          <p className="mt-3 text-sm"><span className="text-muted-foreground">Structure : </span>{r.market_structure}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.trend_explanation}</p>
        </Section>

        <Section title="Supports et résistances">
          <div className="grid gap-4 sm:grid-cols-2">
            <Levels items={r.supports} kind="Support" />
            <Levels items={r.resistances} kind="Résistance" />
          </div>
        </Section>

        <Section title="Indicateurs">
          {r.indicators.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun indicateur visible sur la capture.</p>
          ) : (
            <ul className="space-y-3">
              {r.indicators.map((ind, i) => (
                <li key={i} className="rounded-lg border bg-surface p-3">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{ind.name}</span>
                    {ind.values && <span className="font-mono text-xs text-muted-foreground">{ind.values}</span>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{ind.interpretation}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Scénarios possibles">
          <div className="space-y-3">
            {r.bullish_scenario && (
              <Scenario title="Scénario haussier" tone="border-bullish/30" titleCls="text-bullish" rows={[
                ["Conditions nécessaires", r.bullish_scenario.conditions],
                ["Niveau d'invalidation", r.bullish_scenario.invalidation],
                ["Éléments en faveur", r.bullish_scenario.supporting_elements],
              ]} />
            )}
            {r.bearish_scenario && (
              <Scenario title="Scénario baissier" tone="border-bearish/30" titleCls="text-bearish" rows={[
                ["Conditions nécessaires", r.bearish_scenario.conditions],
                ["Niveau d'invalidation", r.bearish_scenario.invalidation],
                ["Éléments en faveur", r.bearish_scenario.supporting_elements],
              ]} />
            )}
            {r.neutral_scenario && (
              <Scenario title="Scénario neutre" tone="border-info/30" titleCls="text-info" rows={[
                ["Conditions nécessaires", r.neutral_scenario.conditions],
                ["Confirmation d'une sortie de range", r.neutral_scenario.breakout_confirmation],
              ]} />
            )}
            {!r.bullish_scenario && !r.bearish_scenario && !r.neutral_scenario && (
              <p className="text-sm text-muted-foreground">Les données visibles ne permettent pas de formuler de scénario.</p>
            )}
            <p className="text-xs text-muted-foreground">Ces scénarios sont des possibilités, aucun n'est certain.</p>
          </div>
        </Section>

        <Section title="Gestion du risque" className="border-warning/30">
          <p className="text-sm leading-relaxed">{r.risk_notes}</p>
          {r.risk_reward && <p className="mt-3 text-sm"><span className="text-muted-foreground">Ratio risque/rendement estimé : </span><span className="font-mono">{r.risk_reward}</span></p>}
          <div className="mt-4 flex gap-2 rounded-lg bg-warning/10 p-3 text-xs text-warning">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Analyse éducative, pas un conseil financier. Ne risque jamais une somme que tu ne peux pas te permettre de perdre.
          </div>
        </Section>
      </div>
    </div>
  );
}

function Scenario({ title, rows, tone, titleCls }: { title: string; rows: [string, string][]; tone: string; titleCls: string }) {
  return (
    <div className={`rounded-lg border bg-surface p-4 ${tone}`}>
      <h3 className={`text-sm font-semibold ${titleCls}`}>{title}</h3>
      <dl className="mt-2 space-y-2">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="text-sm">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
