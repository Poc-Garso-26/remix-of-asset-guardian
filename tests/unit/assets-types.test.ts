/**
 * Mapas de tipo e situação de ativo — garantem que todo tipo/situação tem
 * rótulo e rota, evitando textos ou links faltando na UI.
 */
import { describe, expect, it } from "vitest";
import {
  ASSET_STATUS_LABEL,
  ASSET_STATUS_TONE,
  ASSET_TYPE_LABEL,
  ASSET_TYPE_LIST_ROUTE,
  ASSET_TYPE_PLURAL_LABEL,
  type AssetStatus,
  type AssetType,
} from "@/lib/assets-types";

const TYPES: AssetType[] = ["computador", "notebook", "impressora"];
const STATUSES: AssetStatus[] = ["em_uso", "estoque", "manutencao", "baixado"];

describe("mapas por tipo de ativo", () => {
  it("tem rótulo singular e plural para cada tipo", () => {
    for (const t of TYPES) {
      expect(ASSET_TYPE_LABEL[t]).toBeTruthy();
      expect(ASSET_TYPE_PLURAL_LABEL[t]).toBeTruthy();
    }
    expect(Object.keys(ASSET_TYPE_LABEL).sort()).toEqual([...TYPES].sort());
    expect(Object.keys(ASSET_TYPE_PLURAL_LABEL).sort()).toEqual([...TYPES].sort());
  });

  it("aponta para as rotas dedicadas de listagem", () => {
    expect(ASSET_TYPE_LIST_ROUTE).toEqual({
      computador: "/ativos/computadores",
      notebook: "/ativos/notebooks",
      impressora: "/ativos/impressoras",
    });
    for (const t of TYPES) {
      expect(ASSET_TYPE_LIST_ROUTE[t].startsWith("/ativos/")).toBe(true);
    }
  });
});

describe("mapas por situação", () => {
  it("tem rótulo para cada situação", () => {
    expect(Object.keys(ASSET_STATUS_LABEL).sort()).toEqual([...STATUSES].sort());
    for (const s of STATUSES) expect(ASSET_STATUS_LABEL[s]).toBeTruthy();
  });

  it("tem tom visual válido para cada situação", () => {
    const allowed = ["success", "info", "warning", "muted"];
    for (const s of STATUSES) expect(allowed).toContain(ASSET_STATUS_TONE[s]);
  });
});
