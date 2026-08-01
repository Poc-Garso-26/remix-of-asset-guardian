/**
 * Campo de data em português: digitação com máscara dd/mm/aaaa + calendário
 * (shadcn Calendar em Popover). O valor externo permanece em ISO (YYYY-MM-DD),
 * independente do locale do navegador/SO.
 */
import { useEffect, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** "2026-08-01" -> Date local (sem deslocamento de fuso). */
export function isoToLocalDate(iso: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return undefined;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** ISO -> "01/08/2026" */
function isoToBr(iso: string): string {
  const d = isoToLocalDate(iso);
  return d ? `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}` : "";
}

/** "01/08/2026" -> ISO (ou "" se incompleta/inválida) */
function brToIso(br: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br);
  if (!m) return "";
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return "";
  return toIso(d);
}

/** Aplica máscara dd/mm/aaaa durante a digitação. */
function mask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
  return parts.join("/");
}

interface Props {
  value: string; // ISO
  onChange: (iso: string) => void;
  id?: string;
  name?: string;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  "aria-required"?: boolean;
}

export function DateField({ value, onChange, className, ...aria }: Props) {
  const [text, setText] = useState(() => isoToBr(value));
  const [open, setOpen] = useState(false);

  // Sincroniza quando o valor muda por fora (reset do formulário, calendário).
  useEffect(() => {
    setText((prev) => (brToIso(prev) === value ? prev : isoToBr(value)));
  }, [value]);

  const selected = isoToLocalDate(value);

  return (
    <div className="flex items-center gap-2">
      <input
        {...aria}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="dd/mm/aaaa"
        value={text}
        onChange={(e) => {
          const next = mask(e.target.value);
          setText(next);
          onChange(brToIso(next));
        }}
        className={cn(
          "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
          className,
        )}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Escolher data no calendário"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-card text-foreground/80 outline-none hover:bg-accent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={ptBR}
            selected={selected}
            defaultMonth={selected}
            onSelect={(d) => {
              if (d) {
                const iso = toIso(d);
                onChange(iso);
                setText(isoToBr(iso));
              }
              setOpen(false);
            }}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
