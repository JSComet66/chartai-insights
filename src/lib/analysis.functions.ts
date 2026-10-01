import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { MARKETS, TIMEFRAMES } from "./analysis-types";

const inputSchema = z.object({
  imagePath: z.string().min(1).max(300),
  asset: z.string().trim().max(40).nullable().optional(),
  timeframe: z.enum(TIMEFRAMES).nullable().optional(),
  market: z.enum(MARKETS).nullable().optional(),
});

export type RunAnalysisResult = { ok: true; id: string } | { ok: false; error: string };

export const runAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data, context }): Promise<RunAnalysisResult> => {
    const { supabase, userId } = context;
    if (!data.imagePath.startsWith(`${userId}/`)) {
      return { ok: false, error: "Image invalide." };
    }

    const { runExternalAnalysis, isExternalAnalysisReady } = await import("./external-analysis/service.server");
    const { ExternalAnalysisError } = await import("./external-analysis/types");
    const { SERVICE_NOT_READY_MESSAGE } = await import("./external-analysis/provider.server");
    if (!isExternalAnalysisReady()) return { ok: false, error: SERVICE_NOT_READY_MESSAGE };

    const { data: blob, error: dlError } = await supabase.storage.from("charts").download(data.imagePath);
    if (dlError || !blob) {
      return { ok: false, error: "Image introuvable. Importez-la à nouveau." };
    }
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const ext = data.imagePath.split(".").pop()?.toLowerCase();
    const mimeType = blob.type?.startsWith("image/")
      ? blob.type
      : ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

    let result;
    try {
      result = await runExternalAnalysis({
        image: { bytes, mimeType },
        asset: data.asset ?? null,
        timeframe: data.timeframe ?? null,
        market: data.market ?? null,
      });
    } catch (e) {
      if (e instanceof ExternalAnalysisError) return { ok: false, error: e.message };
      console.error(e);
      return { ok: false, error: "L'analyse a échoué. Réessayez dans quelques instants." };
    }

    if (!result.is_chart) {
      return {
        ok: false,
        error: "Aucun graphique n'a été détecté sur cette image. Importez une capture de graphique de trading.",
      };
    }
    if (!result.image_readable) {
      return {
        ok: false,
        error:
          "Impossible d'analyser correctement cette image. Essayez avec une capture plus nette et montrant davantage le graphique.",
      };
    }

    const { data: row, error } = await supabase
      .from("analyses")
      .insert({
        user_id: userId,
        image_url: data.imagePath,
        asset: data.asset || result.asset_detected,
        timeframe: data.timeframe || result.timeframe_detected,
        market: data.market || result.market_detected,
        analysis_result: result as never,
      })
      .select("id")
      .single();
    if (error || !row) {
      console.error(error);
      return { ok: false, error: "L'analyse n'a pas pu être enregistrée." };
    }
    return { ok: true, id: row.id };
  });
