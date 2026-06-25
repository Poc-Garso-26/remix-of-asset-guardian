import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, Pencil, Trash2, Loader2 } from "lucide-react";
import { assetsService } from "@/lib/assets-service";
import {
  ASSET_STATUS_LABEL,
  ASSET_TYPE_LABEL,
  type Asset,
} from "@/lib/assets-types";
import { StatusBadge } from "@/components/status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/ativos/$id/")({
  head: () => ({ meta: [{ title: "Detalhes do ativo — GestãoTI" }] }),
  component: AssetDetailsPage,
});

function AssetDetailsPage() {
  const { id } = Route.useParams();
  const { can } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: asset, isLoading } = useQuery({
    queryKey: ["asset", id],
    queryFn: () => assetsService.get(id),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-12 text-center">
        <h2 className="font-display text-2xl">Ativo não encontrado</h2>
        <p className="mt-2 text-sm text-muted-foreground">O ativo solicitado pode ter sido removido.</p>
        <Link to="/ativos" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          Voltar para a lista
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    await assetsService.remove(asset.id);
    await qc.invalidateQueries({ queryKey: ["assets"] });
    await qc.invalidateQueries({ queryKey: ["assets-summary"] });
    toast.success("Ativo excluído", { description: asset.patrimony });
    navigate({ to: "/ativos" });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button
            onClick={() => navigate({ to: "/ativos" })}
            className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-3 w-3" /> Voltar para ativos
          </button>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {ASSET_TYPE_LABEL[asset.type]}
          </p>
          <h1 className="mt-1 font-display text-4xl tracking-tight">{asset.brand} {asset.model}</h1>
          <p className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono">{asset.patrimony}</span>
            <span aria-hidden>•</span>
            <StatusBadge status={asset.status} />
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {can("asset.edit") && (
            <Link
              to="/ativos/$id/editar"
              params={{ id: asset.id }}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <Pencil className="h-4 w-4" /> Editar
            </Link>
          )}
          {can("asset.delete") && (
            <button
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <InfoCard title="Identificação" className="lg:col-span-2">
          <Row label="Patrimônio" value={asset.patrimony} mono />
          <Row label="Nº de série" value={asset.serialNumber} mono />
          <Row label="Marca" value={asset.brand} />
          <Row label="Modelo" value={asset.model} />
          <Row label="Situação" value={ASSET_STATUS_LABEL[asset.status]} />
          <Row label="Data de aquisição" value={fmtDate(asset.acquisitionDate)} />
        </InfoCard>

        <InfoCard title="Alocação">
          <Row label="Setor" value={asset.sector} />
          <Row label="Responsável" value={asset.responsible} />
          <Row label="Localização" value={asset.location} />
          <Row label="CEP" value={asset.cep} />
          <Row label="Logradouro" value={asset.logradouro} />
          <Row label="Bairro" value={asset.bairro} />
          <Row label="Cidade" value={asset.cidade} />
          <Row label="UF" value={asset.uf} />
          <Row label="Cadastro" value={fmtDateTime(asset.createdAt)} />
        </InfoCard>

        {asset.type !== "impressora" && (
          <InfoCard title="Especificações técnicas" className="lg:col-span-2">
            <Row label="Processador" value={asset.processor} />
            <Row label="Memória RAM" value={asset.ram} />
            <Row label="Armazenamento" value={asset.storage} />
            <Row label="Sistema operacional" value={asset.operatingSystem} />
            <Row label="Hostname" value={asset.hostname} mono />
            <Row label="Endereço IP" value={asset.ipAddress} mono />
            <Row label="Endereço MAC" value={asset.macAddress} mono />
          </InfoCard>
        )}

        {asset.type === "impressora" && (
          <InfoCard title="Especificações" className="lg:col-span-2">
            <Row label="Tipo de impressão" value={asset.printType} />
            <Row label="Colorida" value={asset.color ? "Sim" : "Não"} />
            <Row label="Em rede" value={asset.network ? "Sim" : "Não"} />
          </InfoCard>
        )}

        {asset.notes && (
          <InfoCard title="Observações" className="lg:col-span-3">
            <p className="whitespace-pre-wrap text-sm text-foreground/90">{asset.notes}</p>
          </InfoCard>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Excluir ativo?"
        description={`Esta ação não pode ser desfeita. O ativo ${asset.patrimony} será removido permanentemente do inventário.`}
        confirmLabel="Sim, excluir"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

function InfoCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-border bg-card p-5 ${className ?? ""}`}>
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function Row({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={`mt-0.5 text-sm ${mono ? "font-mono" : ""}`}>{value || "—"}</dd>
    </div>
  );
}

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR");
}
function fmtDateTime(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _A = Asset;
