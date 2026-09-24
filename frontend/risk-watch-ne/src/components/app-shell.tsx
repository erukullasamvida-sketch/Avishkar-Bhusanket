import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Brain,
  Database,
  FileText,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Mountain,
  Settings as SettingsIcon,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { useLocationSelection } from "@/hooks/use-location-selection";
import { supabase } from "@/integrations/supabase/client";
import { getLocations } from "@/lib/api/locations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/risk-map", label: "Risk Map", icon: Map },
  { to: "/prediction", label: "AI Prediction", icon: Brain },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/analytics", label: "Reports", icon: BarChart3 },
  { to: "/field-reports", label: "Field Reports", icon: FileText },
  { to: "/data-sources", label: "Data Sources", icon: Database },
  { to: "/about", label: "About", icon: Activity },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

const MOBILE_NAV = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/risk-map", label: "Map", icon: Map },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/field-reports", label: "Reports", icon: FileText },
] as const;

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-4">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary">
        <Mountain className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-sidebar-foreground">BHUSANKET</p>
        <p className="truncate text-[11px] text-sidebar-foreground/60">AI Risk Monitoring</p>
      </div>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1 px-2 pb-4">
      {NAV.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  title,
  subtitle,
  actions,
  children,
  user,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  user?: { name: string; role: string } | null;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectLocation } = useLocationSelection();
  const { data: searchResults = [], isFetching } = useQuery({
    queryKey: ["backend_locations", search.trim()],
    queryFn: () => getLocations(search),
    enabled: Boolean(search.trim()),
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <Brand />
        <div className="flex-1 overflow-y-auto">
          <NavList />
        </div>
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-navy/60"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-sidebar">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                className="mr-3 rounded-md p-2 text-sidebar-foreground/70"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavList onNavigate={() => setOpen(false)} />
            </div>
            <div className="border-t border-sidebar-border p-3">
              <button
                onClick={signOut}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/75"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
            <button
              className="rounded-md p-2 text-foreground lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative block min-w-0 md:block">
              <Input
                placeholder="Search locations, villages, or regions..."
                className="h-9 max-w-md"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search.trim() && (
                <div className="absolute mt-1 w-full max-w-md overflow-hidden rounded-md border border-border bg-card shadow-md">
                  {isFetching && (
                    <p className="px-3 py-2 text-sm text-muted-foreground">Searching...</p>
                  )}
                  {!isFetching && searchResults.length === 0 && (
                    <p className="px-3 py-2 text-sm text-muted-foreground">No locations found.</p>
                  )}
                  {!isFetching &&
                    searchResults.map((location) => (
                      <button
                        key={location.id}
                        type="button"
                        className="block w-full px-3 py-2 text-left hover:bg-muted"
                        onClick={() => {
                          selectLocation(location);
                          setSearch(location.name);
                        }}
                      >
                        <span className="block text-sm font-medium text-foreground">
                          {location.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {location.district}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Link
                to="/alerts"
                className="relative rounded-md p-2 text-muted-foreground hover:text-foreground"
                aria-label="Alerts"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-risk-critical" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {(user?.name ?? "A").charAt(0).toUpperCase()}
                </div>
                <div className="hidden min-w-0 sm:block">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {user?.name ?? "Officer"}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {user?.role ?? "System User"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 pb-24 pt-5 lg:px-6 lg:pb-8">
          <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight text-foreground lg:text-2xl">
                {title}
              </h1>
              {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
          </div>
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}

function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-card lg:hidden">
      {MOBILE_NAV.map((item) => {
        const active = pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-border bg-card", className)}>
      {(title || actions) && (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            {title && <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>}
            {description && (
              <p className="truncate text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function KpiCard({
  label,
  value,
  unit,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: typeof Activity;
  tone?: "default" | "high" | "critical" | "info";
}) {
  const tones: Record<string, string> = {
    default: "bg-accent text-accent-foreground",
    high: "bg-risk-high-soft text-risk-high",
    critical: "bg-risk-critical-soft text-risk-critical",
    info: "bg-secondary text-secondary-foreground",
  };
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-md", tones[tone])}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold leading-none text-foreground">
            {value}
            {unit && <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>}
          </p>
        </div>
      </div>
    </div>
  );
}

export function EmptyRow({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>;
}

export { AlertTriangle, Activity };
