/**
 * Serviço de dados de Ativos.
 *
 * IMPORTANTE: Implementação MOCK em localStorage que imita a interface de uma
 * API REST. Para trocar pela API real, mantenha as mesmas assinaturas e
 * substitua o corpo das funções por chamadas fetch (ex.: `fetch(API_URL + "/assets")`).
 */
import type { Asset, AssetStatus, AssetType } from "./assets-types";

const STORAGE_KEY = "gti.assets.v1";

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function seed(): Asset[] {
  const now = new Date();
  const iso = (daysAgo: number) =>
    new Date(now.getTime() - daysAgo * 86400000).toISOString();
  const date = (daysAgo: number) => iso(daysAgo).slice(0, 10);

  const sectors = ["TI", "Financeiro", "RH", "Comercial", "Operações", "Diretoria"];
  const responsibles = [
    "Ana Silva",
    "Bruno Costa",
    "Carla Mendes",
    "Diego Rocha",
    "Eduarda Lima",
    "Felipe Souza",
  ];
  const brands = ["Dell", "HP", "Lenovo", "Apple", "Acer"];
  const printerBrands = ["HP", "Brother", "Epson", "Canon"];

  const items: Asset[] = [];
  for (let i = 0; i < 14; i++) {
    items.push({
      id: uid(),
      type: "computador",
      patrimony: `PC-${1000 + i}`,
      serialNumber: `SN-PC-${100000 + i}`,
      brand: brands[i % brands.length],
      model: `OptiPlex ${7000 + i}`,
      processor: "Intel Core i5-12400",
      ram: "16 GB",
      storage: "512 GB SSD",
      operatingSystem: i % 3 === 0 ? "Windows 11 Pro" : "Ubuntu 22.04",
      hostname: `desk-${i.toString().padStart(3, "0")}`,
      ipAddress: `10.0.1.${10 + i}`,
      macAddress: `00:1A:2B:3C:4D:${(10 + i).toString(16).padStart(2, "0").toUpperCase()}`,
      sector: sectors[i % sectors.length],
      responsible: responsibles[i % responsibles.length],
      location: `Andar ${1 + (i % 4)} - Sala ${100 + i}`,
      status: (["em_uso", "em_uso", "estoque", "manutencao"] as AssetStatus[])[i % 4],
      acquisitionDate: date(180 + i * 7),
      createdAt: iso(40 - i),
    });
  }
  for (let i = 0; i < 12; i++) {
    items.push({
      id: uid(),
      type: "notebook",
      patrimony: `NB-${2000 + i}`,
      serialNumber: `SN-NB-${200000 + i}`,
      brand: brands[i % brands.length],
      model: `ThinkPad T${14 + (i % 4)}`,
      processor: "Intel Core i7-1365U",
      ram: "32 GB",
      storage: "1 TB SSD",
      operatingSystem: "Windows 11 Pro",
      hostname: `lap-${i.toString().padStart(3, "0")}`,
      ipAddress: `10.0.2.${10 + i}`,
      macAddress: `00:2C:3D:4E:5F:${(10 + i).toString(16).padStart(2, "0").toUpperCase()}`,
      sector: sectors[(i + 1) % sectors.length],
      responsible: responsibles[(i + 2) % responsibles.length],
      location: "Home Office",
      status: (["em_uso", "em_uso", "em_uso", "baixado"] as AssetStatus[])[i % 4],
      acquisitionDate: date(120 + i * 5),
      createdAt: iso(30 - i),
    });
  }
  for (let i = 0; i < 6; i++) {
    items.push({
      id: uid(),
      type: "impressora",
      patrimony: `IMP-${3000 + i}`,
      serialNumber: `SN-IMP-${300000 + i}`,
      brand: printerBrands[i % printerBrands.length],
      model: `LaserJet Pro ${400 + i}`,
      sector: sectors[i % sectors.length],
      responsible: responsibles[i % responsibles.length],
      location: `Andar ${1 + (i % 4)} - Copa`,
      status: (["em_uso", "estoque", "manutencao"] as AssetStatus[])[i % 3],
      acquisitionDate: date(200 + i * 10),
      createdAt: iso(20 - i),
      printType: (["laser", "jato_tinta", "laser"] as const)[i % 3],
      color: i % 2 === 0,
      network: true,
    });
  }
  return items;
}

function load(): Asset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Asset[];
  } catch {
    // ignore
  }
  const initial = seed();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function save(items: Asset[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// --- Filtros ---
export interface AssetFilters {
  type?: AssetType | "all";
  patrimony?: string;
  serialNumber?: string;
  brand?: string;
  model?: string;
  responsible?: string;
  sector?: string;
  status?: AssetStatus | "all";
  operatingSystem?: string;
  createdFrom?: string;
  createdTo?: string;
  acquiredFrom?: string;
  acquiredTo?: string;
  q?: string; // pesquisa rápida
}

function matches(asset: Asset, f: AssetFilters): boolean {
  const text = (v?: string) => (v ?? "").toLowerCase();
  if (f.type && f.type !== "all" && asset.type !== f.type) return false;
  if (f.status && f.status !== "all" && asset.status !== f.status) return false;
  if (f.patrimony && !text(asset.patrimony).includes(text(f.patrimony))) return false;
  if (f.serialNumber && !text(asset.serialNumber).includes(text(f.serialNumber))) return false;
  if (f.brand && !text(asset.brand).includes(text(f.brand))) return false;
  if (f.model && !text(asset.model).includes(text(f.model))) return false;
  if (f.responsible && !text(asset.responsible).includes(text(f.responsible))) return false;
  if (f.sector && !text(asset.sector).includes(text(f.sector))) return false;
  if (f.operatingSystem && !text(asset.operatingSystem).includes(text(f.operatingSystem))) return false;
  if (f.createdFrom && asset.createdAt.slice(0, 10) < f.createdFrom) return false;
  if (f.createdTo && asset.createdAt.slice(0, 10) > f.createdTo) return false;
  if (f.acquiredFrom && asset.acquisitionDate < f.acquiredFrom) return false;
  if (f.acquiredTo && asset.acquisitionDate > f.acquiredTo) return false;
  if (f.q) {
    const q = text(f.q);
    const hay = [
      asset.patrimony,
      asset.serialNumber,
      asset.brand,
      asset.model,
      asset.responsible,
      asset.sector,
      asset.hostname,
      asset.location,
    ]
      .map(text)
      .join(" ");
    if (!hay.includes(q)) return false;
  }
  return true;
}

// --- API ---
export const assetsService = {
  async list(filters: AssetFilters = {}): Promise<Asset[]> {
    await new Promise((r) => setTimeout(r, 120));
    return load().filter((a) => matches(a, filters));
  },

  async get(id: string): Promise<Asset | undefined> {
    return load().find((a) => a.id === id);
  },

  async create(input: Omit<Asset, "id" | "createdAt">): Promise<Asset> {
    const items = load();
    const next: Asset = { ...input, id: uid(), createdAt: new Date().toISOString() };
    save([next, ...items]);
    return next;
  },

  async update(id: string, patch: Partial<Asset>): Promise<Asset> {
    const items = load();
    const i = items.findIndex((a) => a.id === id);
    if (i === -1) throw new Error("Ativo não encontrado");
    items[i] = { ...items[i], ...patch };
    save(items);
    return items[i];
  },

  async remove(id: string): Promise<void> {
    save(load().filter((a) => a.id !== id));
  },

  async summary() {
    const items = load();
    const monthAgo = Date.now() - 30 * 86400000;
    return {
      total: items.length,
      computadores: items.filter((a) => a.type === "computador").length,
      notebooks: items.filter((a) => a.type === "notebook").length,
      impressoras: items.filter((a) => a.type === "impressora").length,
      novosNoMes: items.filter((a) => new Date(a.createdAt).getTime() >= monthAgo).length,
      recentes: [...items]
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, 6),
    };
  },
};
