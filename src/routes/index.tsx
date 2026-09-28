import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TrendingUp, Layers, GitBranch, Activity, Split, ShieldAlert, History, Upload, ScanSearch, FileText, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ChartAI — Analyse tes graphiques avec l'IA" },
      { name: "description", content: "Importe une capture de ton graphique et obtiens une analyse technique structurée et éducative en quelques secondes." },
      { property: "og:title", content: "ChartAI — Analyse tes graphiques avec l'IA" },
      { property: "og:description", content: "Analyse technique éducative de graphiques de trading, générée par l'IA." },
    ],
  }),
  component: Home,
});

const steps = [
  { icon: Upload, title: "Importe ton graphique", text: "Une simple capture d'écran JPG, PNG ou WEBP depuis ton ordinateur ou ta galerie." },
  { icon: ScanSearch, title: "L'IA analyse les éléments visibles", text: "Tendance, niveaux, structure et indicateurs lisibles — rien d'inventé." },
  { icon: FileText, title: "Consulte l'analyse détaillée", text: "Un rapport structuré, avec scénarios possibles et points de risque." },
];

const features = [
  { icon: TrendingUp, title: "Analyse de tendance", text: "Direction principale et lecture du contexte." },
  { icon: Layers, title: "Supports et résistances", text: "Niveaux approximatifs et leur importance." },
  { icon: GitBranch, title: "Structures de marché", text: "Sommets, creux, ranges et cassures." },
  { icon: Activity, title: "Indicateurs visibles", text: "Identification et lecture lorsque lisibles." },
  { icon: Split, title: "Scénarios possibles", text: "Haussier, baissier, neutre — jamais certains." },
  { icon: ShieldAlert, title: "Gestion du risque", text: "Invalidation et ratio risque/rendement." },
  { icon: History, title: "Historique des analyses", text: "Retrouve toutes tes analyses enregistrées." },
];

function Home() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="grid-bg absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 text-center md:pt-28">
          <span className="fade-up inline-flex items-center gap-2 rounded-full border bg-surface px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Analyse éducative, pas de passage d'ordres
          </span>
          <h1 className="fade-up mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
            Analyse tes graphiques <span className="text-primary">avec l'IA</span>
          </h1>
          <p className="fade-up mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            Importe une capture de ton graphique et obtiens une analyse technique structurée en quelques secondes.
          </p>
          <div className="fade-up mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg"><Link to="/analyse">Analyser un graphique</Link></Button>
            <Button asChild size="lg" variant="outline"><a href="#fonctionnement">Découvrir ChartAI</a></Button>
          </div>
          <HeroPreview />
        </div>
      </section>

      <section id="fonctionnement" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
        <h2 className="text-2xl font-semibold md:text-3xl">Comment ça marche</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <s.icon className="h-5 w-5 text-primary" />
                <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="text-2xl font-semibold md:text-3xl">Fonctionnalités</h2>
        <div className="mt-8 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="bg-card p-6 transition-colors hover:bg-surface">
              <f.icon className="h-5 w-5 text-info" />
              <h3 className="mt-4 text-sm font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-6 md:p-8">
          <div className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Important</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            ChartAI fournit une analyse éducative et informative, basée uniquement sur les éléments visibles de ta capture.
            Elle ne constitue pas un conseil financier et ne garantit aucun résultat. Les scénarios présentés sont des
            possibilités, pas des prédictions. Les marchés financiers comportent des risques importants de perte en capital :
            ne risque jamais une somme que tu ne peux pas te permettre de perdre.
          </p>
        </div>
      </section>
    </div>
  );
}

function HeroPreview() {
  const candles = [
    [30, 50, 1], [45, 62, 1], [55, 58, 0], [50, 70, 1], [62, 66, 0], [58, 80, 1], [72, 76, 0], [70, 90, 1],
    [82, 86, 0], [78, 94, 1], [88, 92, 0], [85, 100, 1],
  ];
  return (
    <div className="fade-up mx-auto mt-16 max-w-4xl rounded-2xl border bg-card p-2 text-left shadow-2xl shadow-primary/5">
      <div className="grid gap-2 md:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl bg-surface p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono">BTC/USDT · 4 h</span><span>Crypto</span>
          </div>
          <svg viewBox="0 0 240 120" className="mt-3 h-40 w-full">
            <line x1="0" y1="78" x2="240" y2="78" className="stroke-primary/40" strokeDasharray="4 4" />
            <line x1="0" y1="22" x2="240" y2="22" className="stroke-bearish/40" strokeDasharray="4 4" />
            {candles.map(([lo, hi, up], i) => {
              const x = 12 + i * 19;
              const y1 = 120 - hi; const y2 = 120 - lo;
              return (
                <g key={i}>
                  <line x1={x + 4} x2={x + 4} y1={y1 - 4} y2={y2 + 4} className={up ? "stroke-primary" : "stroke-bearish"} />
                  <rect x={x} y={y1} width="8" height={Math.max(y2 - y1, 2)} rx="1" className={up ? "fill-primary" : "fill-bearish"} />
                </g>
              );
            })}
          </svg>
        </div>
        <div className="space-y-2 p-2 text-sm">
          <Row label="Tendance" value="Haussière" cls="text-primary" />
          <Row label="Structure" value="Sommets et creux ascendants" />
          <Row label="Support" value="≈ 61 200" cls="font-mono" />
          <Row label="Résistance" value="≈ 68 900" cls="font-mono" />
          <Row label="Qualité de l'analyse" value="Élevée" cls="text-info" />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, cls = "" }: { label: string; value: string; cls?: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-surface px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${cls}`}>{value}</span>
    </div>
  );
}
