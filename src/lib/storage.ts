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
