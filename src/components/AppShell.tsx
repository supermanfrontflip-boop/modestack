import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Crosshair, Database, Star, Radar, FlaskConical, ShieldCheck } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { ModeProvider } from "@/lib/mode-provider";


const navItems = [
  { to: "/", label: "Recommend", icon: Radar },
  { to: "/vault", label: "Vault", icon: Database },
  { to: "/favorites", label: "Stacks", icon: Star },
  { to: "/tests", label: "Tests", icon: FlaskConical },
  { to: "/privacy", label: "Privacy", icon: ShieldCheck },
] as const;


export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          <div className="hud-corner relative h-9 w-9 grid place-items-center border border-border bg-card">
            <Crosshair className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] tracking-[0.25em] text-muted-foreground mono">
              PROMPT // COMMAND CENTER
            </div>
            <div className="text-sm mono glow-text text-primary truncate">
              {pathname === "/" ? "RECOMMEND" : pathname === "/vault" ? "MODE VAULT" : pathname === "/favorites" ? "FAVORITE STACKS" : pathname === "/tests" ? "REGRESSION TESTS" : pathname === "/privacy" ? "PRIVACY & SUPPORT" : "STATION"}
            </div>

          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] mono text-muted-foreground">ONLINE</span>
          </div>
        </div>
        <div className="scan-line" />
      </header>

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-5 pb-[calc(7.5rem+env(safe-area-inset-bottom))]">
        <ModeProvider>
          <Outlet />
        </ModeProvider>
      </main>


      <nav
        aria-label="Primary"
        className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/85 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto max-w-2xl grid grid-cols-5">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-1 min-h-14 py-3 mono text-[10px] tracking-widest transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon aria-hidden="true" className={`h-5 w-5 ${active ? "drop-shadow-[0_0_8px_var(--color-hud)]" : ""}`} />
                {label.toUpperCase()}
              </Link>
            );
          })}
        </div>
      </nav>


      <Toaster />
    </div>
  );
}
