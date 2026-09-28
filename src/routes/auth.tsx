import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoMark } from "@/components/Logo";
import { safeRedirect, useAuth } from "@/lib/auth";

const searchSchema = z.object({
  mode: z.enum(["login", "signup", "forgot"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Connexion — ChartAI" },
      { name: "description", content: "Connecte-toi ou crée ton compte ChartAI." },
      { property: "og:title", content: "Connexion — ChartAI" },
      { property: "og:description", content: "Accède à tes analyses de graphiques." },
    ],
  }),
  component: AuthPage,
});

const REDIRECT_KEY = "chartai_redirect";

function AuthPage() {
  const search = Route.useSearch();
  const mode = search.mode ?? "login";
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const stored = sessionStorage.getItem(REDIRECT_KEY);
      sessionStorage.removeItem(REDIRECT_KEY);
      navigate({ to: safeRedirect(search.redirect ?? stored), replace: true });
    }
  }, [user, navigate, search.redirect]);

  const setMode = (m: "login" | "signup" | "forgot") => {
    setInfo(null);
    navigate({ to: "/auth", search: { ...search, mode: m }, replace: true });
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setInfo(null);
    try {
      if (mode === "signup") {
        if (password.length < 8) throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${safeRedirect(search.redirect)}` },
        });
        if (error) throw error;
        if (!data.session) setInfo("Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse.");
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error("Email ou mot de passe incorrect.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setInfo("Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (search.redirect) sessionStorage.setItem(REDIRECT_KEY, safeRedirect(search.redirect));
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth` });
    if (result.error) toast.error("Connexion avec Google impossible.");
  }

  const title = mode === "signup" ? "Créer un compte" : mode === "forgot" ? "Mot de passe oublié" : "Se connecter";

  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-16">
      <LogoMark className="h-10 w-10" />
      <h1 className="mt-6 text-2xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {mode === "forgot" ? "Reçois un lien pour choisir un nouveau mot de passe." : "Accède à tes analyses de graphiques."}
      </p>

      {mode !== "forgot" && (
        <>
          <Button variant="outline" className="mt-6" onClick={google} type="button">
            Continuer avec Google
          </Button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form onSubmit={submit} className={`space-y-4 ${mode === "forgot" ? "mt-6" : ""}`}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {mode !== "forgot" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mot de passe</Label>
              {mode === "login" && (
                <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setMode("forgot")}>
                  Mot de passe oublié ?
                </button>
              )}
            </div>
            <Input
              id="password" type="password" required minLength={mode === "signup" ? 8 : undefined}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        )}
        {info && <p className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm">{info}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Patiente…" : mode === "signup" ? "Créer mon compte" : mode === "forgot" ? "Envoyer le lien" : "Se connecter"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "signup" ? (
          <>Déjà un compte ? <button className="text-foreground underline" onClick={() => setMode("login")}>Se connecter</button></>
        ) : mode === "login" ? (
          <>Pas encore de compte ? <button className="text-foreground underline" onClick={() => setMode("signup")}>Créer un compte</button></>
        ) : (
          <button className="text-foreground underline" onClick={() => setMode("login")}>Retour à la connexion</button>
        )}
      </p>
    </div>
  );
}
