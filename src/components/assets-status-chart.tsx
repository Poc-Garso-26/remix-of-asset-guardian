import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cell, Pie, PieChart } from "recharts";
import { assetsService } from "@/lib/assets-service";
import { ASSET_STATUS_LABEL, type AssetStatus } from "@/lib/assets-types";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

const KNOWN_COLORS: Record<AssetStatus, string> = {
  em_uso: "var(--success)",
  estoque: "var(--info)",
  manutencao: "var(--warning)",
  baixado: "var(--muted-foreground)",
};

const FALLBACK_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function colorForStatus(status: string, index: number): string {
  return (KNOWN_COLORS as Record<string, string | undefined>)[status] ??
    FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

function labelForStatus(status: string): string {
  return (ASSET_STATUS_LABEL as Record<string, string | undefined>)[status] ?? status;
}

export function AssetsStatusChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["assets-status-distribution"],
    queryFn: () => assetsService.statusDistribution(),
  });

  const { chartData, config, total } = useMemo(() => {
    const rows = data ?? [];
    const total = rows.reduce((sum, r) => sum + r.count, 0);
    const chartData = rows.map((r, i) => ({
      status: r.status,
      label: r.label,
      count: r.count,
      fill: colorForStatus(r.status, i),
    }));
    const config: ChartConfig = Object.fromEntries(
      chartData.map((r) => [r.status, { label: r.label, color: r.fill }]),
    );
    return { chartData, config, total };
  }, [data]);

  useEffect(() => {
    const root = chartRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>("svg, [tabindex]").forEach((el) => {
      el.setAttribute("tabindex", "-1");
    });
  }, [chartData]);

  const ariaLabel = total === 0
    ? "Gráfico de rosca: distribuição dos ativos por situação. Sem dados."
    : `Gráfico de rosca: distribuição dos ativos por situação. Total ${total}. ${chartData
        .map((r) => `${r.label}: ${r.count} (${((r.count / total) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%)`)
        .join("; ")}.`;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold">Situação dos Ativos</h2>
        <p className="text-xs text-muted-foreground">Distribuição por situação</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-around">
          <Skeleton className="h-40 w-40 rounded-full" />
          <div className="w-full max-w-[180px] space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <p className="text-sm text-destructive">Falha ao carregar dados.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-xs font-medium text-primary hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      ) : total === 0 ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-sm text-muted-foreground">Nenhum dado encontrado.</p>
        </div>
      ) : (
        <div ref={chartRef} role="img" aria-label={ariaLabel}>
          <ChartContainer config={config} className="mx-auto aspect-square max-h-[260px] w-full">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, _name, item) => {
                      const count = Number(value);
                      const pct = total > 0 ? (count / total) * 100 : 0;
                      const label = (item?.payload as { label?: string })?.label ?? "";
                      const fill = (item?.payload as { fill?: string })?.fill;
                      return (
                        <div className="flex w-full items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                            style={{ background: fill }}
                          />
                          <div className="flex flex-1 items-center justify-between gap-3">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-mono font-medium tabular-nums text-foreground">
                              {count} ({pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%)
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                }
              />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="status"
                innerRadius={60}
                outerRadius={90}
                strokeWidth={2}
                paddingAngle={2}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey="status" />}
                verticalAlign="bottom"
              />
            </PieChart>
          </ChartContainer>
          <div className="sr-only">
            <table>
            <caption>Distribuição dos ativos por situação</caption>
            <thead>
              <tr>
                <th scope="col">Situação</th>
                <th scope="col">Quantidade</th>
                <th scope="col">Percentual</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((r) => (
                <tr key={r.status}>
                  <th scope="row">{r.label}</th>
                  <td>{r.count}</td>
                  <td>
                    {((r.count / total) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
