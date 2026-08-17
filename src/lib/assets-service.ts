import type { Asset, AssetStatus, AssetType } from "./assets-types";
import {
  acquisitionsTimelineFn,
  assetsSummaryFn,
  createAssetFn,
  getAssetFn,
  listAssetsFn,
  regenerateAssetQrCodeFn,
  removeAssetFn,
  statusDistributionFn,
  updateAssetFn,
} from "./assets.functions";

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
  qrCode?: "all" | "with" | "without";
}

export type AssetInput = Omit<Asset, "id" | "createdAt">;

/**
 * Client facade for the authenticated asset BFF.
 * No Supabase credential or direct table access is present in the browser bundle.
 */
export const assetsService = {
  list(filters: AssetFilters = {}): Promise<Asset[]> {
    return listAssetsFn({ data: filters });
  },

  get(id: string): Promise<Asset | null> {
    return getAssetFn({ data: { id } });
  },

  create(input: AssetInput): Promise<Asset> {
    return createAssetFn({ data: input });
  },

  update(id: string, input: AssetInput): Promise<Asset> {
    return updateAssetFn({ data: { id, input } });
  },

  async remove(id: string): Promise<void> {
    await removeAssetFn({ data: { id } });
  },

  summary() {
    return assetsSummaryFn();
  },

  acquisitionsTimeline(): Promise<
    Array<{ month: string; label: string; fullLabel: string; count: number }>
  > {
    return acquisitionsTimelineFn();
  },

  statusDistribution(): Promise<
    Array<{ status: AssetStatus; label: string; count: number }>
  > {
    return statusDistributionFn();
  },
};

export function regenerateAssetQrCode(
  assetId: string,
  options?: { force?: boolean },
): Promise<{ url: string | null; skipped: boolean }> {
  return regenerateAssetQrCodeFn({
    data: { id: assetId, force: options?.force === true },
  });
}
