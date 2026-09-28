import { supabase } from "@/integrations/supabase/client";

export async function signedChartUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from("charts").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function signedChartUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data } = await supabase.storage.from("charts").createSignedUrls(paths, 3600);
  const map: Record<string, string> = {};
  data?.forEach((d) => {
    if (d.path && d.signedUrl) map[d.path] = d.signedUrl;
  });
  return map;
}

export async function deleteAnalysis(row: { id: string; image_url: string }) {
  const { error } = await supabase.from("analyses").delete().eq("id", row.id);
  if (error) throw error;
  await supabase.storage.from("charts").remove([row.image_url]);
}
