import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { AssetForm } from "@/components/asset-form";
import { assetsService } from "@/lib/assets-service";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/ativos/novo")({
  head: () => ({ meta: [{ title: "Novo ativo — GestãoTI" }] }),
  component: NewAssetPage,
});

function NewAssetPage() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  if (!can("asset.create")) return <Navigate to="/ativos" replace />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <button
          onClick={() => navigate({ to: "/ativos" })}
          className="mb-3 inline-flex min-h-9 items-center gap-1 rounded-md text-xs text-muted-foreground underline decoration-dotted underline-offset-4 transition-colors hover:text-foreground hover:decoration-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:decoration-solid"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" /> Voltar para ativos
        </button>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Inventário</p>
        <h1 className="mt-1 font-display text-4xl tracking-tight">Cadastrar novo ativo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preencha as informações para registrar um equipamento no inventário.
        </p>
      </header>

      <AssetForm
        submitLabel="Cadastrar ativo"
        onCancel={() => navigate({ to: "/ativos" })}
        onSubmit={async (values) => {
          const created = await assetsService.create(values);
          await qc.invalidateQueries({ queryKey: ["assets"] });
          await qc.invalidateQueries({ queryKey: ["assets-summary"] });
          await qc.invalidateQueries({ queryKey: ["assets-status-distribution"] });

          toast.success("Ativo cadastrado com sucesso", {
            description: `${created.patrimony} • ${created.brand} ${created.model}`,
          });
          navigate({ to: "/ativos" });
        }}
      />
    </div>
  );
}
