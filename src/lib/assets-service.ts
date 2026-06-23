/**
 * Camada de acesso a Ativos — backend Supabase.
 * Mapeia entre o shape de domínio `Asset` e as tabelas
 * `assets`, `asset_computer_specs`, `asset_printer_specs`, `sectors`, `locations`.
 */
import { supabase } from "@/integrations/supabase/client";
import type {
  Asset,
  AssetStatus,
  AssetType,
  PrintType,
} from "./assets-types";

export interface AssetFilters {
  type?: AssetType | "all";
  status?: AssetStatus | "all";
  q?: string;
  patrimony?: string;
  serialNumber?: string;
  brand?: string;
  model?: string;
  responsible?: string;
  sector?: string;
  operatingSystem?: string;
  createdFrom?: string;
  createdTo?: string;
  acquiredFrom?: string;
  acquiredTo?: string;
}

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
  created_at: string;
  sectors: { nome: string } | null;
  locations: { nome: string } | null;
  asset_computer_specs:
    | {
        processor: string | null;
        ram: string | null;
        storage: string | null;
        operating_system: string | null;
        hostname: string | null;
        ip_address: unknown;
        mac_address: unknown;
      }
    | null;
  asset_printer_specs: {
    print_type: PrintType | null;
    color: boolean;
    network: boolean;
  } | null;
};

function rowToAsset(r: RawRow): Asset {
  const comp = r.asset_computer_specs ?? undefined;
  const prn = r.asset_printer_specs ?? undefined;
  return {
    id: r.id,
    type: r.type,
    patrimony: r.patrimony,
    serialNumber: r.serial_number,
    brand: r.brand,
    model: r.model,
    status: r.status,
    acquisitionDate: r.acquisition_date ?? "",
    notes: r.notes ?? undefined,
    responsible: r.responsible_name ?? "",
    sector: r.sectors?.nome ?? "",
    location: r.locations?.nome ?? "",
    createdAt: r.created_at,
    processor: comp?.processor ?? undefined,
    ram: comp?.ram ?? undefined,
    storage: comp?.storage ?? undefined,
    operatingSystem: comp?.operating_system ?? undefined,
    hostname: comp?.hostname ?? undefined,
    ipAddress: comp?.ip_address ? String(comp.ip_address) : undefined,
    macAddress: comp?.mac_address ? String(comp.mac_address) : undefined,
    printType: prn?.print_type ?? undefined,
    color: prn?.color ?? undefined,
    network: prn?.network ?? undefined,
  };
}

async function upsertByName(
  table: "sectors" | "locations",
  nome: string,
): Promise<string | null> {
  const trimmed = nome.trim();
  if (!trimmed) return null;
  const existing = await supabase
    .from(table)
    .select("id")
    .ilike("nome", trimmed)
    .maybeSingle();
  if (existing.data?.id) return existing.data.id;
  const inserted = await supabase
    .from(table)
    .insert({ nome: trimmed })
    .select("id")
    .single();
  if (inserted.error) throw inserted.error;
  return inserted.data.id;
}

export type AssetInput = Omit<Asset, "id" | "createdAt">;

function matches(a: Asset, f: AssetFilters): boolean {
  if (f.patrimony && !a.patrimony.toLowerCase().includes(f.patrimony.toLowerCase())) return false;
  if (f.serialNumber && !a.serialNumber.toLowerCase().includes(f.serialNumber.toLowerCase())) return false;
  if (f.brand && !a.brand.toLowerCase().includes(f.brand.toLowerCase())) return false;
  if (f.model && !a.model.toLowerCase().includes(f.model.toLowerCase())) return false;
  if (f.responsible && !a.responsible.toLowerCase().includes(f.responsible.toLowerCase())) return false;
  if (f.sector && !a.sector.toLowerCase().includes(f.sector.toLowerCase())) return false;
  if (f.operatingSystem && !(a.operatingSystem ?? "").toLowerCase().includes(f.operatingSystem.toLowerCase())) return false;
  if (f.createdFrom && a.createdAt.slice(0, 10) < f.createdFrom) return false;
  if (f.createdTo && a.createdAt.slice(0, 10) > f.createdTo) return false;
  if (f.acquiredFrom && (a.acquisitionDate || "") < f.acquiredFrom) return false;
  if (f.acquiredTo && (a.acquisitionDate || "") > f.acquiredTo) return false;
  if (f.q) {
    const q = f.q.toLowerCase();
    const hay = [
      a.patrimony,
      a.serialNumber,
      a.brand,
      a.model,
      a.responsible,
      a.sector,
      a.location,
      a.hostname ?? "",
    ]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export const assetsService = {
  async list(filters: AssetFilters = {}): Promise<Asset[]> {
    let q = supabase.from("assets").select(SELECT).order("created_at", { ascending: false });
    if (filters.type && filters.type !== "all") q = q.eq("type", filters.type);
    if (filters.status && filters.status !== "all") q = q.eq("status", filters.status);
    const { data, error } = await q.limit(1000);
    if (error) throw error;
    const mapped = ((data ?? []) as unknown as RawRow[]).map(rowToAsset);
    return mapped.filter((a) => matches(a, filters));
  },

  async get(id: string): Promise<Asset | null> {
    const { data, error } = await supabase
      .from("assets")
      .select(SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToAsset(data as unknown as RawRow) : null;
  },

  async create(input: AssetInput): Promise<Asset> {
    const sector_id = await upsertByName("sectors", input.sector);
    const location_id = await upsertByName("locations", input.location);

    const { data, error } = await supabase
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
        sector_id,
        location_id,
      })
      .select("id")
      .single();
    if (error) throw error;
    const id = data.id;

    if (input.type === "impressora") {
      await supabase.from("asset_printer_specs").insert({
        asset_id: id,
        print_type: input.printType ?? null,
        color: !!input.color,
        network: input.network ?? true,
      });
    } else {
      await supabase.from("asset_computer_specs").insert({
        asset_id: id,
        processor: input.processor || null,
        ram: input.ram || null,
        storage: input.storage || null,
        operating_system: input.operatingSystem || null,
        hostname: input.hostname || null,
        ip_address: input.ipAddress || null,
        mac_address: input.macAddress || null,
      });
    }

    const created = await assetsService.get(id);
    if (!created) throw new Error("Falha ao recuperar ativo recém-criado");
    return created;
  },

  async update(id: string, input: AssetInput): Promise<Asset> {
    const sector_id = await upsertByName("sectors", input.sector);
    const location_id = await upsertByName("locations", input.location);

    const { error } = await supabase
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
        sector_id,
        location_id,
      })
      .eq("id", id);
    if (error) throw error;

    if (input.type === "impressora") {
      await supabase.from("asset_computer_specs").delete().eq("asset_id", id);
      await supabase
        .from("asset_printer_specs")
        .upsert({
          asset_id: id,
          print_type: input.printType ?? null,
          color: !!input.color,
          network: input.network ?? true,
        });
    } else {
      await supabase.from("asset_printer_specs").delete().eq("asset_id", id);
      await supabase
        .from("asset_computer_specs")
        .upsert({
          asset_id: id,
          processor: input.processor || null,
          ram: input.ram || null,
          storage: input.storage || null,
          operating_system: input.operatingSystem || null,
          hostname: input.hostname || null,
          ip_address: input.ipAddress || null,
          mac_address: input.macAddress || null,
        });
    }

    const updated = await assetsService.get(id);
    if (!updated) throw new Error("Ativo não encontrado após atualização");
    return updated;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("assets").delete().eq("id", id);
    if (error) throw error;
  },

  async summary() {
    const all = await assetsService.list();
    const byType = (t: AssetType) => all.filter((a) => a.type === t).length;
    const recentes = all.slice(0, 6);
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const novosNoMes = all.filter((a) => new Date(a.createdAt).getTime() >= since).length;
    return {
      total: all.length,
      computadores: byType("computador"),
      notebooks: byType("notebook"),
      impressoras: byType("impressora"),
      recentes,
      novosNoMes,
    };
  },
};
