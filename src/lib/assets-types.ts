/**
 * Tipos de domínio para Ativos de TI.
 * Compartilhado entre serviço de dados (mock/REST) e componentes de UI.
 */

export type AssetType = "computador" | "notebook" | "impressora";
export type AssetStatus = "em_uso" | "estoque" | "manutencao" | "baixado";
export type PrintType = "laser" | "jato_tinta" | "termica" | "matricial";

export interface Asset {
  id: string;
  type: AssetType;
  patrimony: string;
  serialNumber: string;
  brand: string;
  model: string;
  processor?: string;
  ram?: string;
  storage?: string;
  operatingSystem?: string;
  hostname?: string;
  ipAddress?: string;
  macAddress?: string;
  sector: string;
  responsible: string;
  location: string;
  status: AssetStatus;
  acquisitionDate: string; // ISO yyyy-mm-dd
  createdAt: string; // ISO datetime
  notes?: string;

  // Impressora
  printType?: PrintType;
  color?: boolean;
  network?: boolean;
}

export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  computador: "Computador",
  notebook: "Notebook",
  impressora: "Impressora",
};

export const ASSET_STATUS_LABEL: Record<AssetStatus, string> = {
  em_uso: "Em uso",
  estoque: "Estoque",
  manutencao: "Manutenção",
  baixado: "Baixado",
};

export const ASSET_STATUS_TONE: Record<AssetStatus, "success" | "info" | "warning" | "muted"> = {
  em_uso: "success",
  estoque: "info",
  manutencao: "warning",
  baixado: "muted",
};
