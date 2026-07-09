import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Monitor,
  Laptop,
  Printer,
  FileBarChart2,
  Shield,
  UserCircle,
  LogOut,
  Boxes,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth, roleLabel, type Permission } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission?: Permission;
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/ativos", label: "Todos os ativos", icon: Boxes },
  { to: "/ativos/computadores", label: "Computadores", icon: Monitor },
  { to: "/ativos/notebooks", label: "Notebooks", icon: Laptop },
  { to: "/ativos/impressoras", label: "Impressoras", icon: Printer },
  { to: "/relatorios", label: "Relatórios", icon: FileBarChart2, permission: "report.view" },
  { to: "/administracao", label: "Administração", icon: Shield, permission: "user.manage" },
];

const COLLAPSED_STORAGE_KEY = "gti.sidebar.collapsed.v1";

export function AppShell({ children }: { children: ReactNode }) {
  const { session, logout, can } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Track desktop breakpoint (>= 1024px, matches Tailwind `lg`)
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  // Mobile drawer: Esc closes; move focus to close button; restore on close.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    closeButtonRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (!mobileOpen && wasOpenRef.current) {
      menuButtonRef.current?.focus({ preventScroll: true });
    }
    wasOpenRef.current = mobileOpen;
  }, [mobileOpen]);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COLLAPSED_STORAGE_KEY);
      if (stored === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  // Persist on change
  useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSED_STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  if (!session) return null;

  const isActive = (item: NavItem) => pathname === item.to;

  const initials = session.user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const labelClass = cn("truncate", collapsed && "lg:hidden");
  const itemClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
      collapsed && "lg:justify-center lg:px-0",
      active
        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
    );

  return (
    <div className="flex min-h-dvh bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Pular para conteúdo principal
      </a>
      {/* Sidebar */}
      <aside
        id="app-sidebar"
        role={mobileOpen && !isDesktop ? "dialog" : undefined}
        aria-modal={mobileOpen && !isDesktop ? true : undefined}
        aria-label={mobileOpen && !isDesktop ? "Menu de navegação" : undefined}
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 -translate-x-full border-r border-sidebar-border bg-sidebar transition-[width,transform] duration-200 ease-in-out lg:static lg:translate-x-0",
          mobileOpen && "translate-x-0",
          collapsed && "lg:w-16",
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center gap-2 border-b border-sidebar-border px-5",
            collapsed && "lg:justify-center lg:px-2",
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Boxes className="h-4 w-4" />
          </div>
          <div className={cn("flex flex-col leading-tight", collapsed && "lg:hidden")}>
            <span className="text-sm font-semibold tracking-tight">GestãoTI</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Ativos de TI
            </span>
          </div>
          <button
            ref={closeButtonRef}
            className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className={cn("px-3 py-4", collapsed && "lg:px-2")}>
          <p
            className={cn(
              "px-2 pb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground",
              collapsed && "lg:hidden",
            )}
          >
            Navegação
          </p>
          <ul className="flex flex-col gap-0.5">
            {NAV.filter((i) => !i.permission || can(i.permission)).map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                    aria-label={item.label}
                    className={itemClass(active)}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className={labelClass}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <p
            className={cn(
              "mt-6 px-2 pb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground",
              collapsed && "lg:hidden",
            )}
          >
            Conta
          </p>
          <ul className="flex flex-col gap-0.5">
            <li>
              <Link
                to="/perfil"
                onClick={() => setMobileOpen(false)}
                title={collapsed ? "Perfil" : undefined}
                aria-label="Perfil"
                className={itemClass(pathname === "/perfil")}
              >
                <UserCircle className="h-4 w-4 shrink-0" />
                <span className={labelClass}>Perfil</span>
              </Link>
            </li>
            <li>
              <button
                onClick={() => { void logout(); }}
                title={collapsed ? "Sair" : undefined}
                aria-label="Sair"
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/60 hover:text-destructive",
                  collapsed && "lg:justify-center lg:px-0",
                )}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span className={labelClass}>Sair</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-foreground/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur lg:px-8">
          <button
            ref={menuButtonRef}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => {
              if (!isDesktop) {
                setMobileOpen((v) => !v);
              } else {
                setCollapsed((v) => !v);
              }
            }}
            aria-controls="app-sidebar"
            aria-label={
              !isDesktop
                ? mobileOpen ? "Fechar menu" : "Abrir menu"
                : collapsed ? "Expandir menu" : "Recolher menu"
            }
            aria-expanded={!isDesktop ? mobileOpen : !collapsed}
          >
            <span className="lg:hidden">
              <Menu className="h-4 w-4" />
            </span>
            <span className="hidden lg:inline">
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </span>
          </button>

          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{session.user.name}</p>
              <p className="text-xs text-muted-foreground">{roleLabel(session.user.role)}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
              {initials}
            </div>
          </div>
        </header>

        <main id="main" className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
