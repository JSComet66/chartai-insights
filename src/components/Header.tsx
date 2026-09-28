import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const linkCls =
  "rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground";
const activeCls = { className: "text-foreground" };

export function Header() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    setOpen(false);
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const links = (
    <>
      <Link to="/" className={linkCls} activeProps={activeCls} activeOptions={{ exact: true }} onClick={() => setOpen(false)}>
        Accueil
      </Link>
      <Link to="/analyse" className={linkCls} activeProps={activeCls} onClick={() => setOpen(false)}>
        Nouvelle analyse
      </Link>
      <Link to="/analyses" className={linkCls} activeProps={activeCls} onClick={() => setOpen(false)}>
        Mes analyses
      </Link>
      {user && (
        <Link to="/profil" className={linkCls} activeProps={activeCls} onClick={() => setOpen(false)}>
          Profil
        </Link>
      )}
    </>
  );

  const actions = loading ? null : user ? (
    <Button variant="ghost" size="sm" onClick={signOut}>
      Déconnexion
    </Button>
  ) : (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link to="/auth" search={{ mode: "login" }} onClick={() => setOpen(false)}>Se connecter</Link>
      </Button>
      <Button asChild size="sm">
        <Link to="/auth" search={{ mode: "signup" }} onClick={() => setOpen(false)}>Créer un compte</Link>
      </Button>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">{links}</nav>
        <div className="hidden items-center gap-2 md:flex">{actions}</div>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t bg-background px-4 py-3 md:hidden">
          <nav className="flex flex-col">{links}</nav>
          <div className="mt-3 flex flex-col gap-2 border-t pt-3">{actions}</div>
        </div>
      )}
    </header>
  );
}
