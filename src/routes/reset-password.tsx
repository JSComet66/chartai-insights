import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — ChartAI" },
      { name: "description", content: "Choisis un nouveau mot de passe pour ton compte ChartAI." },
      { property: "og:title", content: "Nouveau mot de passe — ChartAI" },
      { property: "og:description", content: "Réinitialisation du mot de passe ChartAI." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) { toast.error("Le mot de passe doit contenir au moins 8 caractères."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error("Lien expiré ou invalide. Refais une demande de réinitialisation."); return; }
    toast.success("Mot de passe mis à jour.");
    navigate({ to: "/analyse" });
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold">Nouveau mot de passe</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pw">Nouveau mot de passe</Label>
          <Input id="pw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button className="w-full" disabled={busy}>{busy ? "Patiente…" : "Mettre à jour"}</Button>
      </form>
    </div>
  );
}
