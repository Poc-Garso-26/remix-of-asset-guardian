import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireKeycloakAuth } from "@/integrations/keycloak/auth-middleware";
import { requirePermission } from "./authorization";
import type { Asset, AssetStatus, AssetType, PrintType } from "./assets-types";
import type { AssetFilters, AssetInput } from "./assets-service";

const assetTypeSchema = z.enum(["computador", "notebook", "impressora"]);
const assetStatusSchema = z.enum(["em_uso", "estoque", "manutencao", "baixado"]);
const printTypeSchema = z.enum(["laser", "jato_tinta", "termica", "matricial"]);

const assetFiltersSchema = z.object({
  type: z.union([assetTypeSchema, z.literal("all")]).optional(),
  status: z.union([assetStatusSchema, z.literal("all")]).optional(),
  q: z.string().max(200).optional(),
  patrimony: z.string().max(120).optional(),
  serialNumber: z.string().max(120).optional(),
  brand: z.string().max(120).optional(),
  model: z.string().max(120).optional(),
  responsible: z.string().max(120).optional(),
  sector: z.string().max(120).optional(),
  operatingSystem: z.string().max(120).optional(),
  createdFrom: z.string().max(10).optional(),
  createdTo: z.string().max(10).optional(),
  acquiredFrom: z.string().max(10).optional(),
  acquiredTo: z.string().max(10).optional(),
  qrCode: z.enum(["all", "with", "without"]).optional(),
});

const optionalText = z.string().max(500).optional();
const assetInputSchema = z.object({
  type: assetTypeSchema,
  patrimony: z.string().min(1).max(120),
  serialNumber: z.string().min(1).max(120),
  brand: z.string().min(1).max(120),
  model: z.string().min(1).max(120),
  processor: optionalText,
  ram: optionalText,
  storage: optionalText,
  operatingSystem: optionalText,
  hostname: optionalText,
  ipAddress: optionalText,
  macAddress: optionalText,
  sector: z.string().max(120),
  responsible: z.string().max(120),
  location: z.string().max(120),
  cep: optionalText,
  logradouro: optionalText,
  bairro: optionalText,
  cidade: optionalText,
  uf: z.string().max(2).optional(),
  status: assetStatusSchema,
  acquisitionDate: z.string().max(10),
  notes: z.string().max(5000).optional(),
  printType: printTypeSchema.optional(),
  color: z.boolean().optional(),
  network: z.boolean().optional(),
});

const SELECT =
  "*, sectors(nome), locations(nome), asset_computer_specs(*), asset_printer_specs(*)";

type RawRow = {
  id: string;
  type: AssetType;
  patrimony: string;
  serial_number: string;
  brand: string;
  model: string;
  status: AssetStatus;
  acquisition_date: string | null;
  notes: string | null;
  responsible_name: string | null;
  sector_id: string | null;
  location_id: string | null;
  cep: string | null;
  logradouro: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  qr_code_url: string | null;
  qr_code_generated_at: string | null;
  created_at: string;
  sectors: { nome: string } | null;
  locations: { nome: string } | null;
  asset_computer_specs: {
    processor: string | null;
    ram: string | null;
    storage: string | null;
    operating_system: string | null;
    hostname: string | null;
    ip_address: unknown;
    mac_address: unknown;
  } | null;
  asset_printer_specs: {
    print_type: PrintType | null;
    color: boolean;
    network: boolean;
  } | null;
};

function rowToAsset(row: RawRow): Asset {
  const computer = row.asset_computer_specs ?? undefined;
  const printer = row.asset_printer_specs ?? undefined;
  return {
    id: row.id,
    type: row.type,
    patrimony: row.patrimony,
    serialNumber: row.serial_number,
    brand: row.brand,
    model: row.model,
    status: row.status,
    acquisitionDate: row.acquisition_date ?? "",
    notes: row.notes ?? undefined,
    responsible: row.responsible_name ?? "",
    sector: row.sectors?.nome ?? "",
    location: row.locations?.nome ?? "",
    cep: row.cep ?? undefined,
    logradouro: row.logradouro ?? undefined,
    bairro: row.bairro ?? undefined,
    cidade: row.cidade ?? undefined,
    uf: row.uf ?? undefined,
    qrCodeUrl: row.qr_code_url ?? undefined,
    qrCodeGeneratedAt: row.qr_code_generated_at ?? undefined,
    createdAt: row.created_at,
    processor: computer?.processor ?? undefined,
    ram: computer?.ram ?? undefined,
    storage: computer?.storage ?? undefined,
    operatingSystem: computer?.operating_system ?? undefined,
    hostname: computer?.hostname ?? undefined,
    ipAddress: computer?.ip_address ? String(computer.ip_address) : undefined,
    macAddress: computer?.mac_address ? String(computer.mac_address) : undefined,
    printType: printer?.print_type ?? undefined,
    color: printer?.color ?? undefined,
    network: printer?.network ?? undefined,
  };
}

function matches(asset: Asset, filters: AssetFilters): boolean {
  const includes = (value: string, search: string) =>
    value.toLowerCase().includes(search.toLowerCase());
  if (filters.patrimony && !includes(asset.patrimony, filters.patrimony)) return false;
  if (filters.serialNumber && !includes(asset.serialNumber, filters.serialNumber)) return false;
  if (filters.brand && !includes(asset.brand, filters.brand)) return false;
  if (filters.model && !includes(asset.model, filters.model)) return false;
  if (filters.responsible && !includes(asset.responsible, filters.responsible)) return false;
  if (filters.sector && !includes(asset.sector, filters.sector)) return false;
  if (filters.operatingSystem && !includes(asset.operatingSystem ?? "", filters.operatingSystem)) {
    return false;
  }
  if (filters.createdFrom && asset.createdAt.slice(0, 10) < filters.createdFrom) return false;
  if (filters.createdTo && asset.createdAt.slice(0, 10) > filters.createdTo) return false;
  if (filters.acquiredFrom && (asset.acquisitionDate || "") < filters.acquiredFrom) return false;
  if (filters.acquiredTo && (asset.acquisitionDate || "") > filters.acquiredTo) return false;
  if (filters.qrCode === "with" && !asset.qrCodeUrl) return false;
  if (filters.qrCode === "without" && asset.qrCodeUrl) return false;
  if (filters.q) {
    const haystack = [
      asset.patrimony,
      asset.serialNumber,
      asset.brand,
      asset.model,
      asset.responsible,
      asset.sector,
      asset.location,
      asset.hostname ?? "",
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(filters.q.toLowerCase())) return false;
  }
  return true;
}

async function getDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function listAssets(filters: AssetFilters = {}): Promise<Asset[]> {
  const db = await getDb();
  let query = db.from("assets").select(SELECT).order("created_at", { ascending: false });
  if (filters.type && filters.type !== "all") query = query.eq("type", filters.type);
  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  const { data, error } = await query.limit(1000);
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as RawRow[]).map(rowToAsset).filter((asset) => matches(asset, filters));
}

async function getAsset(id: string): Promise<Asset | null> {
  const db = await getDb();
  const { data, error } = await db.from("assets").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToAsset(data as unknown as RawRow) : null;
}

async function upsertByName(table: "sectors" | "locations", name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const db = await getDb();
  const source = table === "sectors" ? db.from("sectors") : db.from("locations");
  const existing = await source.select("id").ilike("nome", trimmed).maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data?.id) return existing.data.id;
  const inserted =
    table === "sectors"
      ? await db.from("sectors").insert({ nome: trimmed }).select("id").single()
      : await db.from("locations").insert({ nome: trimmed }).select("id").single();
  if (inserted.error) throw new Error(inserted.error.message);
  return inserted.data.id;
}

async function invokeQrFunction(
  functionName: "generate-asset-qrcode" | "delete-asset-qrcode",
  assetId: string,
  force = false,
): Promise<{ url: string | null; skipped: boolean }> {
  const db = await getDb();
  const { data, error } = await db.functions.invoke<{ url?: string; skipped?: boolean }>(
    functionName,
    { body: { assetId, ...(functionName === "generate-asset-qrcode" ? { force } : {}) } },
  );
  if (error) throw new Error(error.message);
  return { url: data?.url ?? null, skipped: data?.skipped === true };
}

async function createAsset(input: AssetInput): Promise<Asset> {
  const db = await getDb();
  const sectorId = await upsertByName("sectors", input.sector);
  const locationId = await upsertByName("locations", input.location);
  const { data, error } = await db
    .from("assets")
    .insert({
      type: input.type,
      patrimony: input.patrimony.trim(),
      serial_number: input.serialNumber.trim(),
      brand: input.brand.trim(),
      model: input.model.trim(),
      status: input.status,
      acquisition_date: input.acquisitionDate || null,
      notes: input.notes || null,
      responsible_name: input.responsible || null,
      sector_id: sectorId,
      location_id: locationId,
      cep: input.cep || null,
      logradouro: input.logradouro || null,
      bairro: input.bairro || null,
      cidade: input.cidade || null,
      uf: input.uf ? input.uf.toUpperCase() : null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const id = data.id;
  const specResult =
    input.type === "impressora"
      ? await db.from("asset_printer_specs").insert({
          asset_id: id,
          print_type: input.printType ?? null,
          color: !!input.color,
          network: input.network ?? true,
        })
      : await db.from("asset_computer_specs").insert({
          asset_id: id,
          processor: input.processor || null,
          ram: input.ram || null,
          storage: input.storage || null,
          operating_system: input.operatingSystem || null,
          hostname: input.hostname || null,
          ip_address: input.ipAddress || null,
          mac_address: input.macAddress || null,
        });
  if (specResult.error) {
    await db.from("assets").delete().eq("id", id);
    throw new Error(specResult.error.message);
  }

  const created = await getAsset(id);
  if (!created) throw new Error("Falha ao recuperar ativo recém-criado.");
  try {
    await invokeQrFunction("generate-asset-qrcode", id);
  } catch (error) {
    console.warn("[qrcode] geração automática falhou", error);
  }
  return created;
}

async function updateAsset(id: string, input: AssetInput): Promise<Asset> {
  const db = await getDb();
  const sectorId = await upsertByName("sectors", input.sector);
  const locationId = await upsertByName("locations", input.location);
  const { error } = await db
    .from("assets")
    .update({
      type: input.type,
      patrimony: input.patrimony.trim(),
      serial_number: input.serialNumber.trim(),
      brand: input.brand.trim(),
      model: input.model.trim(),
      status: input.status,
      acquisition_date: input.acquisitionDate || null,
      notes: input.notes || null,
      responsible_name: input.responsible || null,
      sector_id: sectorId,
      location_id: locationId,
      cep: input.cep || null,
      logradouro: input.logradouro || null,
      bairro: input.bairro || null,
      cidade: input.cidade || null,
      uf: input.uf ? input.uf.toUpperCase() : null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  if (input.type === "impressora") {
    const removed = await db.from("asset_computer_specs").delete().eq("asset_id", id);
    if (removed.error) throw new Error(removed.error.message);
    const upserted = await db.from("asset_printer_specs").upsert({
      asset_id: id,
      print_type: input.printType ?? null,
      color: !!input.color,
      network: input.network ?? true,
    });
    if (upserted.error) throw new Error(upserted.error.message);
  } else {
    const removed = await db.from("asset_printer_specs").delete().eq("asset_id", id);
    if (removed.error) throw new Error(removed.error.message);
    const upserted = await db.from("asset_computer_specs").upsert({
      asset_id: id,
      processor: input.processor || null,
      ram: input.ram || null,
      storage: input.storage || null,
      operating_system: input.operatingSystem || null,
      hostname: input.hostname || null,
      ip_address: input.ipAddress || null,
      mac_address: input.macAddress || null,
    });
    if (upserted.error) throw new Error(upserted.error.message);
  }

  const updated = await getAsset(id);
  if (!updated) throw new Error("Ativo não encontrado após atualização.");
  try {
    await invokeQrFunction("generate-asset-qrcode", id);
  } catch (qrError) {
    console.warn("[qrcode] atualização automática falhou", qrError);
  }
  return updated;
}

async function removeAsset(id: string): Promise<void> {
  const db = await getDb();
  try {
    await invokeQrFunction("delete-asset-qrcode", id);
  } catch (error) {
    console.warn("[qrcode] exclusão do arquivo falhou", error);
  }
  const { error } = await db.from("assets").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

function acquisitionsTimeline(assets: Asset[]) {
  const now = new Date();
  const buckets: Array<{ month: string; label: string; fullLabel: string; count: number }> = [];
  const monthFormat = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" });
  const fullMonthFormat = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
  const keyOf = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const index = new Map<string, number>();
  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = keyOf(date);
    index.set(key, buckets.length);
    buckets.push({
      month: key,
      label: monthFormat.format(date).replace(".", ""),
      fullLabel: fullMonthFormat.format(date),
      count: 0,
    });
  }
  for (const asset of assets) {
    const source = asset.acquisitionDate || asset.createdAt;
    const pureDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(source);
    const date = pureDate
      ? new Date(Number(pureDate[1]), Number(pureDate[2]) - 1, Number(pureDate[3]))
      : new Date(source);
    if (Number.isNaN(date.getTime())) continue;
    const bucket = index.get(keyOf(date));
    if (bucket !== undefined) buckets[bucket].count += 1;
  }
  return buckets;
}

export const listAssetsFn = createServerFn({ method: "POST" })
  .middleware([requireKeycloakAuth])
  .validator((input: unknown) => assetFiltersSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    requirePermission(context.roles, "asset.view");
    return listAssets(data);
  });

export const getAssetFn = createServerFn({ method: "POST" })
  .middleware([requireKeycloakAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    requirePermission(context.roles, "asset.view");
    return getAsset(data.id);
  });

export const createAssetFn = createServerFn({ method: "POST" })
  .middleware([requireKeycloakAuth])
  .validator((input: unknown) => assetInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    requirePermission(context.roles, "asset.create");
    return createAsset(data as AssetInput);
  });

export const updateAssetFn = createServerFn({ method: "POST" })
  .middleware([requireKeycloakAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid(), input: assetInputSchema }).parse(input))
  .handler(async ({ data, context }) => {
    requirePermission(context.roles, "asset.edit");
    return updateAsset(data.id, data.input as AssetInput);
  });

export const removeAssetFn = createServerFn({ method: "POST" })
  .middleware([requireKeycloakAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    requirePermission(context.roles, "asset.delete");
    await removeAsset(data.id);
    return { ok: true };
  });

export const assetsSummaryFn = createServerFn({ method: "GET" })
  .middleware([requireKeycloakAuth])
  .handler(async ({ context }) => {
    requirePermission(context.roles, "asset.view");
    const assets = await listAssets();
    const byType = (type: AssetType) => assets.filter((asset) => asset.type === type).length;
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return {
      total: assets.length,
      computadores: byType("computador"),
      notebooks: byType("notebook"),
      impressoras: byType("impressora"),
      recentes: assets.slice(0, 6),
      novosNoMes: assets.filter((asset) => new Date(asset.createdAt).getTime() >= since).length,
    };
  });

export const acquisitionsTimelineFn = createServerFn({ method: "GET" })
  .middleware([requireKeycloakAuth])
  .handler(async ({ context }) => {
    requirePermission(context.roles, "asset.view");
    return acquisitionsTimeline(await listAssets());
  });

export const statusDistributionFn = createServerFn({ method: "GET" })
  .middleware([requireKeycloakAuth])
  .handler(async ({ context }) => {
    requirePermission(context.roles, "asset.view");
    const assets = await listAssets();
    const counts = new Map<AssetStatus, number>();
    for (const asset of assets) counts.set(asset.status, (counts.get(asset.status) ?? 0) + 1);
    const labels: Record<AssetStatus, string> = {
      em_uso: "Em uso",
      estoque: "Estoque",
      manutencao: "Manutenção",
      baixado: "Baixado",
    };
    return Array.from(counts.entries())
      .map(([status, count]) => ({ status, label: labels[status], count }))
      .sort((a, b) => b.count - a.count);
  });

export const regenerateAssetQrCodeFn = createServerFn({ method: "POST" })
  .middleware([requireKeycloakAuth])
  .validator((input: unknown) =>
    z.object({ id: z.string().uuid(), force: z.boolean().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    requirePermission(context.roles, "asset.edit");
    const asset = await getAsset(data.id);
    if (!asset) throw new Error("Ativo não encontrado.");
    return invokeQrFunction("generate-asset-qrcode", data.id, data.force === true);
  });
