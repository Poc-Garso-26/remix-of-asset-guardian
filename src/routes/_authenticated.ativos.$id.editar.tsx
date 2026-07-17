import { createFileRoute, useNavigate, Navigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, Loader2 } from "lucide-react";
import { AssetForm } from "@/components/asset-form";
import { assetsService } from "@/lib/assets-service";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/ativos/$id/editar")({
  head: () => ({ meta: [{ title: "Editar ativo — GestãoTI" }] }),
  component: EditAssetPage,
});

function EditAssetPage() {
  const { id } = Route.useParams();
  const { can } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: asset, isLoading } = useQuery({
    queryKey: ["asset", id],
    queryFn: () => assetsService.get(id),
  });

  if (!can("asset.edit")) return <Navigate to="/ativos" replace />;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Carregando…</span>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-12 text-center">
        <h1 className="font-display text-2xl">Ativo não encontrado</h1>
        <Link to="/ativos" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          Voltar para a lista
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <button
          onClick={() => navigate({ to: "/ativos/$id", params: { id } })}
          className="mb-3 inline-flex min-h-9 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" /> Voltar ao ativo
        </button>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Inventário</p>
        <h1 className="mt-1 font-display text-4xl tracking-tight">Editar ativo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-mono">{asset.patrimony}</span> — {asset.brand} {asset.model}
        </p>
      </header>

      <AssetForm
        initial={asset}
        submitLabel="Salvar alterações"
        onCancel={() => navigate({ to: "/ativos/$id", params: { id } })}
        onSubmit={async (values) => {
          await assetsService.update(asset.id, values);
          await qc.invalidateQueries({ queryKey: ["assets"] });
          await qc.invalidateQueries({ queryKey: ["asset", id] });
          await qc.invalidateQueries({ queryKey: ["assets-summary"] });
          toast.success("Alterações salvas");
          navigate({ to: "/ativos/$id", params: { id } });
        }}
      />
    </div>
  );
}
