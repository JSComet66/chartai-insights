import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { ImagePlus, Loader2, RefreshCw, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { runAnalysis } from "@/lib/analysis.functions";
import { ACCEPTED_TYPES, MARKETS, MAX_FILE_SIZE, TIMEFRAMES } from "@/lib/analysis-types";

export const Route = createFileRoute("/_authenticated/analyse")({
  head: () => ({
    meta: [
      { title: "Nouvelle analyse — ChartAI" },
      { name: "description", content: "Importe une capture de graphique pour lancer une analyse technique par IA." },
      { property: "og:title", content: "Nouvelle analyse — ChartAI" },
      { property: "og:description", content: "Lance une analyse technique éducative de ton graphique." },
    ],
  }),
  component: NewAnalysis,
});

const STEPS = [
  "Lecture du graphique",
  "Détection de la structure",
  "Analyse des indicateurs",
  "Identification des niveaux",
  "Génération du rapport",
];

function NewAnalysis() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const run = useServerFn(runAnalysis);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [asset, setAsset] = useState("");
  const [timeframe, setTimeframe] = useState<string>("");
  const [market, setMarket] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  useEffect(() => {
    if (!loading) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 3500);
    return () => clearInterval(t);
  }, [loading]);

  function pick(f: File | undefined) {
    setError(null);
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError("Format non accepté. Utilise une image JPG, JPEG, PNG ou WEBP.");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setError("L'image est trop grande (8 Mo maximum).");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files?.[0]);
  }

  function clear() {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function launch() {
    if (!file) return setError("Importe d'abord une capture de graphique.");
    if (!user) return setError("Tu dois être connecté pour lancer une analyse.");
    setError(null);
    setLoading(true);
    try {
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("charts").upload(path, file, { contentType: file.type });
      if (upErr) throw new Error("L'envoi de l'image a échoué. Réessaie.");
      const res = await run({
        data: {
          imagePath: path,
          asset: asset.trim() || null,
          timeframe: (timeframe || null) as never,
          market: (market || null) as never,
        },
      });
      if (!res.ok) {
        await supabase.storage.from("charts").remove([path]);
        throw new Error(res.error);
      }
      navigate({ to: "/analyses/$id", params: { id: res.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "L'analyse a échoué.");
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        {preview && <img src={preview} alt="Graphique importé" className="mb-8 max-h-48 w-full rounded-xl border object-contain opacity-70" />}
        <h1 className="text-center text-xl font-semibold">Analyse en cours…</h1>
        <ul className="mt-8 space-y-3">
          {STEPS.map((s, i) => (
            <li key={s} className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-all ${i <= step ? "bg-card" : "opacity-40"}`}>
              {i < step ? <CheckCircle2 className="h-4 w-4 text-primary" /> : i === step ? <Loader2 className="h-4 w-4 animate-spin text-info" /> : <span className="h-4 w-4 rounded-full border" />}
              {s}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Nouvelle analyse</h1>
      <p className="mt-2 text-sm text-muted-foreground">Importe une capture de graphique claire, idéalement avec les prix visibles.</p>

      <div className="mt-8">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        {preview ? (
          <div className="rounded-xl border bg-card p-3">
            <img src={preview} alt="Aperçu du graphique" className="max-h-[420px] w-full rounded-lg object-contain" />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="truncate text-xs text-muted-foreground">{file?.name}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}><RefreshCw className="mr-1 h-4 w-4" />Remplacer</Button>
                <Button variant="ghost" size="sm" onClick={clear}><Trash2 className="mr-1 h-4 w-4" />Supprimer</Button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : "hover:border-primary/50 hover:bg-card"}`}
          >
            <ImagePlus className="h-10 w-10 text-muted-foreground" />
            <p className="mt-4 font-medium">Glisse ta capture ici</p>
            <p className="mt-1 text-xs text-muted-foreground">JPG, JPEG, PNG ou WEBP · 8 Mo max</p>
            <Button className="mt-5" type="button">Importer une image</Button>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="asset">Actif (facultatif)</Label>
          <Input id="asset" placeholder="BTC/USDT, EUR/USD, AAPL…" value={asset} onChange={(e) => setAsset(e.target.value)} maxLength={40} />
        </div>
        <div className="space-y-2">
          <Label>Timeframe (facultatif)</Label>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
            <SelectContent>{TIMEFRAMES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Marché (facultatif)</Label>
          <Select value={market} onValueChange={setMarket}>
            <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
            <SelectContent>{MARKETS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="mt-6 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /> {error}
        </div>
      )}

      <Button size="lg" className="mt-8 w-full sm:w-auto" onClick={launch} disabled={!file}>
        Lancer l'analyse
      </Button>
    </div>
  );
}
