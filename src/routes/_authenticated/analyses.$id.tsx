import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { deleteAnalysis, signedChartUrl } from "@/lib/storage";
import type { AnalysisRow } from "@/lib/analysis-types";
import { AnalysisView } from "@/components/AnalysisView";
import { TechnicalEngineSection } from "@/components/TechnicalEngineSection";

export const Route = createFileRoute("/_authenticated/analyses/$id")({
  head: () => ({
    meta: [
      { title: "Analyse — ChartAI" },
      { name: "description", content: "Détail d'une analyse technique de graphique." },
      { property: "og:title", content: "Analyse — ChartAI" },
      { property: "og:description", content: "Détail d'une analyse ChartAI." },
    ],
  }),
  component: AnalysisDetail,
});

function AnalysisDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["analysis", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("analyses").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row = data as unknown as AnalysisRow;
      return { row, url: await signedChartUrl(row.image_url) };
    },
  });

  if (isLoading) return <div className="mx-auto max-w-6xl px-4 py-12"><div className="h-96 animate-pulse rounded-xl border bg-card" /></div>;
  if (!data) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-muted-foreground">Analyse introuvable.</p>
        <Button asChild className="mt-4"><Link to="/analyses">Mes analyses</Link></Button>
      </div>
    );
  }

  async function remove() {
    if (!data || !confirm("Supprimer cette analyse ?")) return;
    try {
      await deleteAnalysis(data.row);
      toast.success("Analyse supprimée.");
      navigate({ to: "/analyses" });
    } catch {
      toast.error("Suppression impossible.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm"><Link to="/analyses"><ArrowLeft className="mr-1 h-4 w-4" />Mes analyses</Link></Button>
        <Button variant="ghost" size="sm" onClick={remove}><Trash2 className="mr-1 h-4 w-4" />Supprimer</Button>
      </div>
      <AnalysisView row={data.row} imageUrl={data.url} />
      <TechnicalEngineSection imageUrl={data.url} ai={data.row.analysis_result} analysisId={data.row.id} />
    </div>
  );
}
