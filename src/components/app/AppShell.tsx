import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { clearAuthSession, getAccessToken, getAuthMeta, isGuestSession } from "@/lib/auth-session";

const NAV = [
  { to: "/app/scenarios" as const, label: "Skenario" },
  { to: "/app/fleet" as const, label: "Armada" },
  { to: "/app/catalog" as const, label: "Katalog" },
];

export function AppShell() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    const meta = getAuthMeta();
    if (!token || !meta || meta.role !== "user" || isGuestSession()) {
      void navigate({ to: "/login" });
      return;
    }
    setEmail(meta.email ?? null);
    setReady(true);
  }, [navigate]);

  if (!ready) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 text-sm text-zinc-500">
        Memeriksa sesi...
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-3 px-3.5 py-3 sm:px-5">
          <div className="flex items-center gap-6">
            <Link to="/app/scenarios" className="flex items-center gap-2">
              <img src="/logo.png" alt="JagaPanen" className="h-8 w-auto" />
              <span className="text-sm font-semibold text-zinc-800">App</span>
            </Link>
            <nav className="flex items-center gap-1">
              {NAV.map((item) => {
                const active = pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={
                      active
                        ? "rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800"
                        : "rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-slate-100"
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {email ? <span className="hidden text-xs text-zinc-500 sm:inline">{email}</span> : null}
            <Button asChild variant="outline" size="sm" className="h-8 text-xs">
              <Link to="/">Landing</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                clearAuthSession();
                void navigate({ to: "/login" });
              }}
            >
              Keluar
            </Button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
