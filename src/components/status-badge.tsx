import { CheckCircle2, Package, Wrench, Archive, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ASSET_STATUS_LABEL, ASSET_STATUS_TONE, type AssetStatus } from "@/lib/assets-types";

type Tone = "success" | "info" | "warning" | "muted";

const TONE_CLASS: Record<Tone, string> = {
  success: "bg-success text-success-foreground border-success/40",
  info: "bg-info text-info-foreground border-info/40",
  warning: "bg-warning text-warning-foreground border-warning/50",
  muted: "bg-muted-foreground/15 text-foreground border-border",
};

const TONE_ICON: Record<Tone, LucideIcon> = {
  success: CheckCircle2,
  info: Package,
  warning: Wrench,
  muted: Archive,
};

export function StatusBadge({ status }: { status: AssetStatus }) {
  const tone = ASSET_STATUS_TONE[status];
  const Icon = TONE_ICON[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        TONE_CLASS[tone],
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {ASSET_STATUS_LABEL[status]}
    </span>
  );
}
