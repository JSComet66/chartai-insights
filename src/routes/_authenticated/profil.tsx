import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({
    meta: [
      { title: "Profil — ChartAI" },
      { name: "description", content: "Gère ton compte ChartAI." },
      { property: "og:title", content: "Profil — ChartAI" },
      { property: "og:description", content: "Ton profil ChartAI." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { user } = useAuth();
  const [pw, setPw] = useState("");
  const { data: count } = useQuery({
    queryKey: ["analyses-count"],
    queryFn: async () => {
      const { count } = await supabase.from("analyses").select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  async function changePw() {
    if (pw.length < 8) { toast.error("Le mot de passe doit contenir au moins 8 caractères."); return; }
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { toast.error("Mise à jour impossible."); return; }
    setPw("");
    toast.success("Mot de passe mis à jour.");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Profil</h1>
      <div className="mt-8 divide-y rounded-xl border bg-card">
        <Item label="Email" value={user?.email ?? "—"} />
        <Item label="Membre depuis" value={user ? new Date(user.created_at).toLocaleDateString("fr-FR") : "—"} />
        <Item label="Analyses enregistrées" value={String(count ?? "…")} />
      </div>
      <div className="mt-8 rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Changer le mot de passe</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="npw">Nouveau mot de passe</Label>
            <Input id="npw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
          <Button onClick={changePw}>Mettre à jour</Button>
        </div>
      </div>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}
