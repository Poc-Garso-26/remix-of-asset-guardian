import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, Pencil, Trash2, Search, X, Filter, FileDown, Plus } from "lucide-react";
import { z } from "zod";
import { assetsService, type AssetFilters } from "@/lib/assets-service";
import {
  ASSET_STATUS_LABEL,
  ASSET_TYPE_LABEL,
  type AssetStatus,
  type AssetType,
} from "@/lib/assets-types";
import { StatusBadge } from "@/components/status-badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { exportAssetsPdf } from "@/lib/pdf-export";

export const assetsSearchSchema = z.object({
  type: z.enum(["all", "computador", "notebook", "impressora"]).catch("all").default("all"),
  status: z.enum(["all", "em_uso", "estoque", "manutencao", "baixado"]).catch("all").default("all"),
  q: z.string().catch("").default(""),
});

export type AssetsSearch = z.infer<typeof assetsSearchSchema>;

const PAGE_SIZE = 10;

interface Props {
  search: AssetsSearch;
  title: string;
  fixedType?: AssetType;
}

export function AssetsListPage({ search, title, fixedType }: Props) {
  const { can, session } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [filters, setFilters] = useState<AssetFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof typeof COLUMNS>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const effectiveType: AssetType | "all" = fixedType ?? (search.type as AssetType | "all");

  const combined: AssetFilters = useMemo(
    () => ({
      ...filters,
      type: effectiveType,
      status: search.status as AssetStatus | "all",
      q: search.q || filters.q,
    }),
    [filters, search, effectiveType],
  );

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["assets", combined],
    queryFn: () => assetsService.list(combined),
  });

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sortKey] ?? "";
      const bv = (b as unknown as Record<string, unknown>)[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv), "pt-BR", { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toDelete = deleteId ? rows.find((r) => r.id === deleteId) : null;

  const updateSearch = (patch: Partial<AssetsSearch>) => {
    navigate({
      to: ".",
      search: (prev: Record<string, unknown>) => ({ ...prev, ...patch }),
      replace: true,
    });
  };

  const handleExport = () => {
    if (sorted.length === 0) {
      toast.info("Nenhum registro para exportar com os filtros atuais.");
      return;
    }
    exportAssetsPdf({
      title,
      assets: sorted,
      filters: combined,
      generatedBy: session?.user.name,
    });
    toast.success("Relatório PDF gerado", { description: `${sorted.length} registro(s) exportado(s)` });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Inventário
          </p>
          <h1 className="mt-1 font-display text-4xl tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? "Carregando…" : `${sorted.length} registro${sorted.length === 1 ? "" : "s"} encontrado${sorted.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {can("report.export") && (
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
            >
              <FileDown className="h-4 w-4" /> Exportar PDF
            </button>
          )}
          {can("asset.create") && (
            <Link
              to="/ativos/novo"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Novo ativo
            </Link>
          )}
        </div>
      </header>

      {/* Toolbar */}
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Pesquisa rápida por patrimônio, série, modelo, responsável…"
              defaultValue={search.q}
              onChange={(e) => {
                updateSearch({ q: e.target.value });
                setPage(1);
              }}
              className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </div>

          {!fixedType && (
            <select
              aria-label="Filtrar por tipo"
              value={search.type}
              onChange={(e) => {
                updateSearch({ type: e.target.value as AssetsSearch["type"] });
                setPage(1);
              }}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todos os tipos</option>
              <option value="computador">Computadores</option>
              <option value="notebook">Notebooks</option>
              <option value="impressora">Impressoras</option>
            </select>
          )}

          <select
            aria-label="Filtrar por situação"
            value={search.status}
            onChange={(e) => {
              updateSearch({ status: e.target.value as AssetsSearch["status"] });
              setPage(1);
            }}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">Todas as situações</option>
            {(Object.keys(ASSET_STATUS_LABEL) as AssetStatus[]).map((s) => (
              <option key={s} value={s}>{ASSET_STATUS_LABEL[s]}</option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters((s) => !s)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium",
              showFilters ? "bg-accent text-accent-foreground" : "bg-card hover:bg-accent",
            )}
          >
            <Filter className="h-4 w-4" /> Filtros avançados
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <FilterInput label="Patrimônio" value={filters.patrimony} onChange={(v) => setFilters((f) => ({ ...f, patrimony: v }))} />
            <FilterInput label="Nº de série" value={filters.serialNumber} onChange={(v) => setFilters((f) => ({ ...f, serialNumber: v }))} />
            <FilterInput label="Marca" value={filters.brand} onChange={(v) => setFilters((f) => ({ ...f, brand: v }))} />
            <FilterInput label="Modelo" value={filters.model} onChange={(v) => setFilters((f) => ({ ...f, model: v }))} />
            <FilterInput label="Responsável" value={filters.responsible} onChange={(v) => setFilters((f) => ({ ...f, responsible: v }))} />
            <FilterInput label="Setor" value={filters.sector} onChange={(v) => setFilters((f) => ({ ...f, sector: v }))} />
            <FilterInput label="Sistema Operacional" value={filters.operatingSystem} onChange={(v) => setFilters((f) => ({ ...f, operatingSystem: v }))} />
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-foreground">QR Code</span>
              <select
                value={filters.qrCode ?? "all"}
                onChange={(e) => setFilters((f) => ({ ...f, qrCode: e.target.value as "all" | "with" | "without" }))}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              >
                <option value="all">Todos</option>
                <option value="with">Com QR Code</option>
                <option value="without">Sem QR Code</option>
              </select>
            </label>
            <FilterInput label="Cadastro de" type="date" value={filters.createdFrom} onChange={(v) => setFilters((f) => ({ ...f, createdFrom: v }))} />
            <FilterInput label="Cadastro até" type="date" value={filters.createdTo} onChange={(v) => setFilters((f) => ({ ...f, createdTo: v }))} />
            <FilterInput label="Aquisição de" type="date" value={filters.acquiredFrom} onChange={(v) => setFilters((f) => ({ ...f, acquiredFrom: v }))} />
            <FilterInput label="Aquisição até" type="date" value={filters.acquiredTo} onChange={(v) => setFilters((f) => ({ ...f, acquiredTo: v }))} />

            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
              <button
                onClick={() => {
                  setFilters({});
                  updateSearch({ type: fixedType ? "all" : "all", status: "all", q: "" });
                  setPage(1);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-accent"
              >
                <X className="h-4 w-4" /> Limpar filtros
              </button>
              <button
                onClick={() => setPage(1)}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Search className="h-4 w-4" /> Pesquisar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                {Object.entries(COLUMNS).map(([key, label]) => {
                  const sortable = key !== "qrCode";
                  const isActive = sortKey === key;
                  const ariaSort: "ascending" | "descending" | "none" | undefined = sortable
                    ? isActive
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                    : undefined;
                  const handleSort = () => {
                    if (!sortable) return;
                    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                    else { setSortKey(key as keyof typeof COLUMNS); setSortDir("asc"); }
                  };
                  return (
                    <th
                      key={key}
                      aria-sort={ariaSort}
                      className="px-4 py-3 text-left font-medium"
                    >
                      {sortable ? (
                        <button
                          type="button"
                          onClick={handleSort}
                          className="inline-flex items-center gap-1 rounded font-medium uppercase tracking-wider hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {label}
                          {isActive && <span aria-hidden="true" className="text-foreground">{sortDir === "asc" ? "↑" : "↓"}</span>}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1">{label}</span>
                      )}
                    </th>
                  );
                })}
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border" aria-busy={isLoading} aria-live="polite">
              {isLoading && (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">Carregando…</td></tr>
              )}
              {!isLoading && paged.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">Nenhum ativo encontrado.</td></tr>
              )}

              {paged.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link
                      to="/ativos/$id"
                      params={{ id: a.id }}
                      className="rounded font-mono text-xs text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {a.patrimony}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{ASSET_TYPE_LABEL[a.type]}</td>
                  <td className="px-4 py-3">{a.brand}</td>
                  <td className="px-4 py-3">{a.model}</td>
                  <td className="px-4 py-3">{a.responsible}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.sector}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3">
                    {a.qrCodeUrl ? (
                      <QrCodePreview url={a.qrCodeUrl} patrimony={a.patrimony} />
                    ) : null}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <IconLink to="/ativos/$id" params={{ id: a.id }} label="Visualizar">
                        <Eye className="h-4 w-4" />
                      </IconLink>
                      {can("asset.edit") && (
                        <IconLink to="/ativos/$id/editar" params={{ id: a.id }} label="Editar">
                          <Pencil className="h-4 w-4" />
                        </IconLink>
                      )}
                      {can("asset.delete") && (
                        <IconBtn
                          label="Excluir"
                          destructive
                          onClick={() => setDeleteId(a.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconBtn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:flex-row">
          <span>
            Página <span className="font-medium text-foreground">{page}</span> de{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
          </span>
          <div className="flex items-center gap-1">
            <PageBtn
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label={page === 1 ? "Sem página anterior" : `Página anterior, página ${page - 1} de ${totalPages}`}
            >Anterior</PageBtn>
            <PageBtn
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label={page >= totalPages ? "Sem próxima página" : `Próxima página, página ${page + 1} de ${totalPages}`}
            >Próxima</PageBtn>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Algumas ações ficam disponíveis apenas para perfis com permissão.{" "}
        <Link to="/perfil" className="text-primary hover:underline">Ver perfil</Link>
      </p>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        title="Excluir ativo?"
        description={toDelete ? `Esta ação não pode ser desfeita. O ativo ${toDelete.patrimony} será removido permanentemente.` : ""}
        confirmLabel="Sim, excluir"
        destructive
        onConfirm={async () => {
          if (!toDelete) return;
          await assetsService.remove(toDelete.id);
          await qc.invalidateQueries({ queryKey: ["assets"] });
          await qc.invalidateQueries({ queryKey: ["assets-summary"] });
          toast.success("Ativo excluído", { description: toDelete.patrimony });
          setDeleteId(null);
        }}
      />
    </div>
  );
}

const COLUMNS = {
  patrimony: "Patrimônio",
  type: "Tipo",
  brand: "Marca",
  model: "Modelo",
  responsible: "Responsável",
  sector: "Setor",
  status: "Situação",
  qrCode: "QR Code",
  createdAt: "Cadastro",

} as const;

function FilterInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-foreground">{label}</label>
      <input
        id={id}
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
      />
    </div>
  );
}

function useIsTouch() {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(hover: none) and (pointer: coarse)");
    const onChange = () => setIsTouch(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isTouch;
}

function QrCodePreview({ url, patrimony }: { url: string; patrimony: string }) {
  const isTouch = useIsTouch();

  const trigger = (
    <img
      src={url}
      alt={`QR Code de ${patrimony}`}
      tabIndex={0}
      loading="lazy"
      className="h-7 w-7 rounded-sm border border-border bg-white object-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onError={(e) => { e.currentTarget.style.display = "none"; }}
    />
  );

  const preview = (
    <img
      src={url}
      alt={`QR Code do ativo ${patrimony}`}
      className="h-48 w-48 rounded-md border border-border bg-white p-2"
    />
  );

  if (isTouch) {
    return (
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent side="right" align="start" sideOffset={8} collisionPadding={12} className="w-auto p-2">
          {preview}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
      <HoverCardContent side="right" align="start" sideOffset={8} collisionPadding={12} className="w-auto p-2">
        {preview}
      </HoverCardContent>
    </HoverCard>
  );
}

function IconBtn({
  children,
  label,
  destructive,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  destructive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "rounded-md p-1.5 text-muted-foreground transition hover:bg-accent",
        destructive && "hover:bg-destructive/10 hover:text-destructive",
      )}
    >
      {children}
    </button>
  );
}

function IconLink({
  to,
  params,
  children,
  label,
}: {
  to: "/ativos/$id" | "/ativos/$id/editar";
  params: { id: string };
  children: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      params={params}
      title={label}
      aria-label={label}
      className="rounded-md p-1.5 text-muted-foreground transition hover:bg-accent"
    >
      {children}
    </Link>
  );
}

function PageBtn({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-accent disabled:opacity-50"
    >
      {children}
    </button>
  );
}
