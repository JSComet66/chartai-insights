import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { signedChartUrls } from "@/lib/storage";
import type { AnalysisRow } from "@/lib/analysis-types";
import { TrendBadge } from "@/components/AnalysisView";

export const Route = createFileRoute("/_authenticated/analyses/")({
  head: () => ({
    meta: [
      { title: "Mes analyses — ChartAI" },
      { name: "description", content: "Retrouve l'historique de tes analyses de graphiques." },
      { property: "og:title", content: "Mes analyses — ChartAI" },
      { property: "og:description", content: "Historique de tes analyses ChartAI." },
    ],
  }),
  component: MyAnalyses,
});

export async function deleteAnalysis(row: Pick<AnalysisRow, "id" | "image_url">) {
  const { error } = await supabase.from("analyses").delete().eq("id", row.id);
  if (error) throw error;
  await supabase.storage.from("charts").remove([row.image_url]);
}

function MyAnalyses() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["analyses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("analyses").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const rows = data as unknown as AnalysisRow[];
      const urls = await signedChartUrls(rows.map((r) => r.image_url));
      return { rows, urls };
    },
  });

  async function remove(row: AnalysisRow) {
    try {
      await deleteAnalysis(row);
      toast.success("Analyse supprimée.");
      qc.invalidateQueries({ queryKey: ["analyses"] });
    } catch {
      toast.error("Suppression impossible.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Mes analyses</h1>
        <Button asChild><Link to="/analyse"><Plus className="mr-1 h-4 w-4" />Nouvelle analyse</Link></Button>
      </div>

      {isLoading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-72 animate-pulse rounded-xl border bg-card" />)}
        </div>
      ) : !data?.rows.length ? (
        <div className="mt-12 rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">Aucune analyse pour le moment.</p>
          <Button asChild className="mt-4"><Link to="/analyse">Analyser un graphique</Link></Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.rows.map((r) => (
            <div key={r.id} className="flex flex-col overflow-hidden rounded-xl border bg-card">
              <div className="aspect-video bg-surface">
                {data.urls[r.image_url] && <img src={data.urls[r.image_url]} alt="" className="h-full w-full object-cover" loading="lazy" />}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-medium">{r.asset || "Actif non précisé"}</span>
                  <TrendBadge trend={r.analysis_result.trend} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  {r.timeframe ? ` · ${r.timeframe}` : ""}
                </p>
                <p className="mt-3 line-clamp-3 flex-1 text-sm text-muted-foreground">{r.analysis_result.summary}</p>
                <div className="mt-4 flex gap-2">
                  <Button asChild size="sm" className="flex-1"><Link to="/analyses/$id" params={{ id: r.id }}>Voir l'analyse</Link></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette analyse ?</AlertDialogTitle>
                        <AlertDialogDescription>Cette action est définitive.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(r)}>Supprimer</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
