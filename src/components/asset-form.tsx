/**
 * Formulário reutilizável de Ativo (criação e edição).
 * Validação client-side com Zod + react-hook-form.
 */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  ASSET_STATUS_LABEL,
  ASSET_TYPE_LABEL,
  type Asset,
} from "@/lib/assets-types";
import { cn } from "@/lib/utils";
import { CepInput } from "@/components/cep-input";


const baseSchema = z.object({
  type: z.enum(["computador", "notebook", "impressora"]),
  patrimony: z.string().trim().min(1, "Informe o patrimônio").max(40),
  serialNumber: z.string().trim().min(1, "Informe o nº de série").max(80),
  brand: z.string().trim().min(1, "Informe a marca").max(60),
  model: z.string().trim().min(1, "Informe o modelo").max(80),
  cep: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^\d{5}-?\d{3}$/.test(v), "CEP inválido"),
  logradouro: z.string().max(160).optional().or(z.literal("")),
  bairro: z.string().max(80).optional().or(z.literal("")),
  cidade: z.string().max(80).optional().or(z.literal("")),
  uf: z.string().max(2).optional().or(z.literal("")),
  sector: z.string().trim().min(1, "Informe o setor").max(60),
  responsible: z.string().trim().min(1, "Informe o responsável").max(80),
  location: z.string().trim().min(1, "Informe a localização").max(120),
  status: z.enum(["em_uso", "estoque", "manutencao", "baixado"]),
  acquisitionDate: z.string().min(1, "Informe a data de aquisição"),
  notes: z.string().max(500).optional().or(z.literal("")),
  // Computador / Notebook
  processor: z.string().max(80).optional().or(z.literal("")),
  ram: z.string().max(40).optional().or(z.literal("")),
  storage: z.string().max(60).optional().or(z.literal("")),
  operatingSystem: z.string().max(60).optional().or(z.literal("")),
  hostname: z.string().max(60).optional().or(z.literal("")),
  ipAddress: z.string().max(45).optional().or(z.literal("")),
  macAddress: z.string().max(40).optional().or(z.literal("")),
  // Impressora
  printType: z.enum(["laser", "jato_tinta", "termica", "matricial"]).optional(),
  color: z.boolean().optional(),
  network: z.boolean().optional(),
});

export type AssetFormValues = z.infer<typeof baseSchema>;

interface Props {
  initial?: Partial<Asset>;
  submitLabel: string;
  onSubmit: (values: AssetFormValues) => Promise<void> | void;
  onCancel?: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export function AssetForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const form = useForm<AssetFormValues>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      type: (initial?.type ?? "computador") as AssetFormValues["type"],
      patrimony: initial?.patrimony ?? "",
      serialNumber: initial?.serialNumber ?? "",
      brand: initial?.brand ?? "",
      model: initial?.model ?? "",
      sector: initial?.sector ?? "",
      responsible: initial?.responsible ?? "",
      location: initial?.location ?? "",
      cep: initial?.cep ?? "",
      logradouro: initial?.logradouro ?? "",
      bairro: initial?.bairro ?? "",
      cidade: initial?.cidade ?? "",
      uf: initial?.uf ?? "",
      status: (initial?.status ?? "em_uso") as AssetFormValues["status"],
      acquisitionDate: initial?.acquisitionDate ?? today(),
      notes: initial?.notes ?? "",
      processor: initial?.processor ?? "",
      ram: initial?.ram ?? "",
      storage: initial?.storage ?? "",
      operatingSystem: initial?.operatingSystem ?? "",
      hostname: initial?.hostname ?? "",
      ipAddress: initial?.ipAddress ?? "",
      macAddress: initial?.macAddress ?? "",
      printType: initial?.printType,
      color: initial?.color ?? false,
      network: initial?.network ?? true,
    },
  });

  const type = form.watch("type");
  const isPrinter = type === "impressora";
  const submitting = form.formState.isSubmitting;

  return (
    <form
      onSubmit={form.handleSubmit(async (v) => {
        await onSubmit(v);
      })}
      className="space-y-6"
    >
      <Section title="Identificação" description="Dados básicos do equipamento.">
        <Field label="Tipo" error={form.formState.errors.type?.message}>
          <select {...form.register("type")} className={inputCls}>
            {(Object.keys(ASSET_TYPE_LABEL) as Array<keyof typeof ASSET_TYPE_LABEL>).map((t) => (
              <option key={t} value={t}>{ASSET_TYPE_LABEL[t]}</option>
            ))}
          </select>
        </Field>
        <Field label="Patrimônio" error={form.formState.errors.patrimony?.message}>
          <input {...form.register("patrimony")} className={inputCls} placeholder="Ex.: PC-1042" />
        </Field>
        <Field label="Nº de série" error={form.formState.errors.serialNumber?.message}>
          <input {...form.register("serialNumber")} className={inputCls} />
        </Field>
        <Field label="Marca" error={form.formState.errors.brand?.message}>
          <input {...form.register("brand")} className={inputCls} />
        </Field>
        <Field label="Modelo" error={form.formState.errors.model?.message}>
          <input {...form.register("model")} className={inputCls} />
        </Field>
        <Field label="Situação" error={form.formState.errors.status?.message}>
          <select {...form.register("status")} className={inputCls}>
            {(Object.keys(ASSET_STATUS_LABEL) as Array<keyof typeof ASSET_STATUS_LABEL>).map((s) => (
              <option key={s} value={s}>{ASSET_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </Field>
      </Section>

      <Section title="Alocação" description="Setor, responsável e localização do ativo.">
        <Field label="Setor" error={form.formState.errors.sector?.message}>
          <input {...form.register("sector")} className={inputCls} />
        </Field>
        <Field label="Responsável" error={form.formState.errors.responsible?.message}>
          <input {...form.register("responsible")} className={inputCls} />
        </Field>
        <Field label="Localização" error={form.formState.errors.location?.message}>
          <input {...form.register("location")} className={inputCls} placeholder="Andar / Sala" />
        </Field>
        <Field label="Data de aquisição" error={form.formState.errors.acquisitionDate?.message}>
          <input type="date" {...form.register("acquisitionDate")} className={inputCls} />
        </Field>
      </Section>

      {!isPrinter && (
        <Section title="Especificações técnicas" description="Hardware e configuração de rede.">
          <Field label="Processador"><input {...form.register("processor")} className={inputCls} /></Field>
          <Field label="Memória RAM"><input {...form.register("ram")} className={inputCls} placeholder="Ex.: 16 GB" /></Field>
          <Field label="Armazenamento"><input {...form.register("storage")} className={inputCls} placeholder="Ex.: 512 GB SSD" /></Field>
          <Field label="Sistema operacional"><input {...form.register("operatingSystem")} className={inputCls} /></Field>
          <Field label="Hostname"><input {...form.register("hostname")} className={inputCls} /></Field>
          <Field label="Endereço IP"><input {...form.register("ipAddress")} className={inputCls} placeholder="10.0.0.1" /></Field>
          <Field label="Endereço MAC"><input {...form.register("macAddress")} className={inputCls} placeholder="00:1A:2B:3C:4D:5E" /></Field>
        </Section>
      )}

      {isPrinter && (
        <Section title="Especificações da impressora" description="Tipo e capacidades.">
          <Field label="Tipo de impressão">
            <select {...form.register("printType")} className={inputCls}>
              <option value="laser">Laser</option>
              <option value="jato_tinta">Jato de tinta</option>
              <option value="termica">Térmica</option>
              <option value="matricial">Matricial</option>
            </select>
          </Field>
          <Field label="Recursos">
            <div className="flex h-9 items-center gap-5">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" {...form.register("color")} className="h-4 w-4 rounded border-input" />
                Colorida
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" {...form.register("network")} className="h-4 w-4 rounded border-input" />
                Em rede
              </label>
            </div>
          </Field>
        </Section>
      )}

      <Section title="Observações" description="Informações adicionais relevantes.">
        <Field label="Notas" className="sm:col-span-2">
          <textarea {...form.register("notes")} rows={3} className={cn(inputCls, "resize-y")} />
        </Field>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-b-xl sm:px-0">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <header className="mb-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs font-medium text-foreground">{label}</span>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}
