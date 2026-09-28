import { Link } from "@tanstack/react-router";

export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-primary/15" />
      <rect x="7" y="15" width="3" height="9" rx="1" className="fill-bearish" />
      <rect x="12.5" y="10" width="3" height="11" rx="1" className="fill-primary" />
      <rect x="18" y="13" width="3" height="7" rx="1" className="fill-bearish" />
      <rect x="23" y="7" width="3" height="11" rx="1" className="fill-primary" />
      <path d="M6 22 L13.5 14 L19.5 17 L26 9" className="stroke-info" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="ChartAI — Accueil">
      <LogoMark />
      <span className="font-display text-lg font-semibold tracking-tight">
        Chart<span className="text-primary">AI</span>
      </span>
    </Link>
  );
}
