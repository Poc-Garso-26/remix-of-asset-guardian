import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { FileDown, Loader2 } from "lucide-react";
import { assetsService, type AssetFilters } from "@/lib/assets-service";
import {
  ASSET_STATUS_LABEL,
  ASSET_TYPE_LABEL,
  type AssetStatus,
  type AssetType,
} from "@/lib/assets-types";
import { useAuth } from "@/lib/auth";
import { exportAssetsPdf } from "@/lib/pdf-export";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — GestãoTI" }] }),
  component: RelatoriosPage,
});

interface ReportFilters {
  type: AssetType | "all";
  status: AssetStatus | "all";
  sector: string;
  responsible: string;
  acquiredFrom: string;
  acquiredTo: string;
}

const initial: ReportFilters = {
  type: "all",
  status: "all",
  sector: "",
  responsible: "",
  acquiredFrom: "",
  acquiredTo: "",
};

function RelatoriosPage() {
  const { can, session } = useAuth();
  const [filters, setFilters] = useState<ReportFilters>(initial);

  if (!can("report.view")) return <Navigate to="/dashboard" replace />;

  const queryFilters: AssetFilters = {
    type: filters.type,
    status: filters.status,
    sector: filters.sector || undefined,
    responsible: filters.responsible || undefined,
    acquiredFrom: filters.acquiredFrom || undefined,
    acquiredTo: filters.acquiredTo || undefined,
  };

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["report-preview", queryFilters],
    queryFn: () => assetsService.list(queryFilters),
  });

  const title =
    filters.type === "all"
      ? "Relatório de ativos"
      : `Relatório de ${ASSET_TYPE_LABEL[filters.type]}s`;

  const handleExport = () => {
    if (!can("report.export")) {
      toast.error("Seu perfil não tem permissão para exportar relatórios.");
      return;
    }
    if (assets.length === 0) {
      toast.info("Nenhum registro corresponde aos filtros selecionados.");
      return;
    }
    exportAssetsPdf({
      title,
      assets,
      filters: queryFilters,
      generatedBy: session?.user.name,
    });
    toast.success("Relatório PDF gerado", { description: `${assets.length} registro(s)` });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Relatórios</p>
        <h1 className="mt-1 font-display text-4xl tracking-tight">Geração de relatórios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure os filtros, visualize a prévia e exporte um PDF em formato A4
          com cabeçalho institucional e paginação automática.
        </p>
      </header>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold">Filtros do relatório</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Tipo de ativo">
            <select
              value={filters.type}
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as ReportFilters["type"] }))}
              className={cls}
            >
              <option value="all">Todos</option>
              {(Object.keys(ASSET_TYPE_LABEL) as AssetType[]).map((t) => (
                <option key={t} value={t}>{ASSET_TYPE_LABEL[t]}</option>
              ))}
            </select>
          </Field>
          <Field label="Situação">
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as ReportFilters["status"] }))}
              className={cls}
            >
              <option value="all">Todas</option>
              {(Object.keys(ASSET_STATUS_LABEL) as AssetStatus[]).map((s) => (
                <option key={s} value={s}>{ASSET_STATUS_LABEL[s]}</option>
              ))}
            </select>
          </Field>
          <Field label="Setor">
            <input value={filters.sector} onChange={(e) => setFilters((f) => ({ ...f, sector: e.target.value }))} className={cls} />
          </Field>
          <Field label="Responsável">
            <input value={filters.responsible} onChange={(e) => setFilters((f) => ({ ...f, responsible: e.target.value }))} className={cls} />
          </Field>
          <Field label="Aquisição de">
            <input type="date" value={filters.acquiredFrom} onChange={(e) => setFilters((f) => ({ ...f, acquiredFrom: e.target.value }))} className={cls} />
          </Field>
          <Field label="Aquisição até">
            <input type="date" value={filters.acquiredTo} onChange={(e) => setFilters((f) => ({ ...f, acquiredTo: e.target.value }))} className={cls} />
          </Field>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <button
            onClick={() => setFilters(initial)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Limpar filtros
          </button>
          <button
            onClick={handleExport}
            disabled={isLoading || assets.length === 0}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            <FileDown className="h-4 w-4" /> Exportar PDF
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold">Prévia</h2>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Carregando…" : `${assets.length} registro(s) corresponde(m) aos filtros`}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2.5 text-left font-medium">Patrimônio</th>
                <th scope="col" className="px-4 py-2.5 text-left font-medium">Tipo</th>
                <th scope="col" className="px-4 py-2.5 text-left font-medium">Marca/Modelo</th>
                <th scope="col" className="px-4 py-2.5 text-left font-medium">Responsável</th>
                <th scope="col" className="px-4 py-2.5 text-left font-medium">Setor</th>
                <th scope="col" className="px-4 py-2.5 text-left font-medium">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  </td>
                </tr>
              )}
              {!isLoading && assets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
              {assets.slice(0, 50).map((a) => (
                <tr key={a.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2 font-mono text-xs">{a.patrimony}</td>
                  <td className="px-4 py-2 text-muted-foreground">{ASSET_TYPE_LABEL[a.type]}</td>
                  <td className="px-4 py-2">{a.brand} {a.model}</td>
                  <td className="px-4 py-2">{a.responsible}</td>
                  <td className="px-4 py-2 text-muted-foreground">{a.sector}</td>
                  <td className="px-4 py-2 text-muted-foreground">{ASSET_STATUS_LABEL[a.status]}</td>
                </tr>
              ))}
              {assets.length > 50 && (
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-center text-xs text-muted-foreground">
                    Exibindo 50 de {assets.length}. O PDF incluirá todos os registros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const cls = "rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
