import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { assetsService } from "@/lib/assets-service";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

const config: ChartConfig = {
  count: { label: "Aquisições", color: "var(--primary)" },
};

export function AssetsTimelineChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["assets", "acquisitions-timeline"],
    queryFn: () => assetsService.acquisitionsTimeline(),
  });

  const total = useMemo(
    () => (data ?? []).reduce((sum, r) => sum + r.count, 0),
    [data],
  );

  useEffect(() => {
    const root = chartRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>("svg, [tabindex]").forEach((el) => {
      el.setAttribute("tabindex", "-1");
    });
  }, [data]);

  return (
    <div
      className="rounded-xl border border-border bg-card p-5"
      aria-label="Aquisições de ativos nos últimos 12 meses"
    >
      <div className="mb-4">
        <h2 className="text-sm font-semibold">Aquisições nos últimos 12 meses</h2>
        <p className="text-xs text-muted-foreground">
          Novos ativos incorporados por mês
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-3 flex-1" />
            ))}
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
          <p className="text-sm text-muted-foreground">
            Sem aquisições no período.
          </p>
        </div>
      ) : (
        <div
          role="img"
          aria-label={`Gráfico de área: aquisições de ativos nos últimos 12 meses. Total ${total}. ${(data ?? [])
            .map((r) => `${r.label}: ${r.count}`)
            .join("; ")}.`}
        >
          <ChartContainer config={config} className="aspect-square max-h-[260px] w-full">
            <AreaChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="acqGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.35} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
              />
              <YAxis hide allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Area
                dataKey="count"
                name="Aquisições"
                type="monotone"
                stroke="var(--color-count)"
                strokeWidth={2}
                fill="url(#acqGradient)"
              />
            </AreaChart>
          </ChartContainer>
          <div className="sr-only">
            <table>
            <caption>Aquisições de ativos nos últimos 12 meses</caption>
            <thead>
              <tr>
                <th scope="col">Mês</th>
                <th scope="col">Aquisições</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((r) => (
                <tr key={r.label}>
                  <th scope="row">{r.label}</th>
                  <td>{r.count}</td>
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
