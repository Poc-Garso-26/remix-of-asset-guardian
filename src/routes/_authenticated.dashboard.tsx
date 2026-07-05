import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Monitor, Laptop, Printer, Package, TrendingUp, ArrowUpRight } from "lucide-react";
import { assetsService } from "@/lib/assets-service";
import { ASSET_TYPE_LABEL } from "@/lib/assets-types";
import { StatusBadge } from "@/components/status-badge";
import { useAuth, roleLabel } from "@/lib/auth";
import { AssetsStatusChart } from "@/components/assets-status-chart";
import { AssetsTimelineChart } from "@/components/assets-timeline-chart";


export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — GestãoTI" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { session } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["assets-summary"],
    queryFn: () => assetsService.summary(),
  });

  const cards = [
    { label: "Computadores", value: data?.computadores ?? 0, icon: Monitor, search: { type: "computador" } },
    { label: "Notebooks", value: data?.notebooks ?? 0, icon: Laptop, search: { type: "notebook" } },
    { label: "Impressoras", value: data?.impressoras ?? 0, icon: Printer, search: { type: "impressora" } },
    { label: "Total de ativos", value: data?.total ?? 0, icon: Package },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Visão geral
        </p>
        <h1 className="mt-1 font-display text-4xl tracking-tight">
          Olá, {session?.user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-foreground/80">
          Você está conectado como <span className="font-medium text-foreground">{roleLabel(session!.user.role)}</span>.
          Aqui está o panorama do parque de TI.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const content = (
            <div className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition hover:border-ring/40 hover:shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                {card.search && (
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="mt-0.5 font-display text-3xl tabular-nums">
                  {isLoading ? "—" : card.value}
                </p>
              </div>
            </div>
          );
          return card.search ? (
            <Link key={card.label} to="/ativos" search={card.search as never}>
              {content}
            </Link>
          ) : (
            <div key={card.label}>{content}</div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Últimos ativos cadastrados</h2>
              <p className="text-xs text-muted-foreground">As 6 inclusões mais recentes</p>
            </div>
            <Link
              to="/ativos"
              className="text-xs font-medium text-primary hover:underline"
            >
              Ver todos
            </Link>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-foreground/80">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Patrimônio</th>
                  <th className="px-3 py-2 text-left font-medium">Tipo</th>
                  <th className="px-3 py-2 text-left font-medium">Modelo</th>
                  <th className="px-3 py-2 text-left font-medium">Responsável</th>
                  <th className="px-3 py-2 text-left font-medium">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.recentes.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2 font-mono text-xs font-bold text-foreground">{a.patrimony}</td>
                    <td className="px-3 py-2 text-foreground/75">{ASSET_TYPE_LABEL[a.type]}</td>
                    <td className="px-3 py-2 font-normal text-foreground/90">{a.brand} {a.model}</td>
                    <td className="px-3 py-2 text-foreground/75">{a.responsible}</td>
                    <td className="px-3 py-2"><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
                {!data && (
                  <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Carregando…</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <div>
            <h2 className="text-sm font-semibold">Cadastros do mês</h2>
            <p className="text-xs text-foreground/75">Últimos 30 dias</p>
          </div>
          <div className="flex items-end gap-2">
            <span className="font-display text-5xl tabular-nums">{data?.novosNoMes ?? "—"}</span>
            <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
              <TrendingUp className="h-3 w-3" /> novos
            </span>
          </div>
          <p className="text-xs text-foreground/75">
            Acompanhe o ritmo de incorporação de novos ativos ao inventário.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AssetsStatusChart />
        </div>
      </section>
    </div>
  );
}
