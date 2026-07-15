/**
 * Campo de CEP com máscara 00000-000 e busca automática no ViaCEP.
 * A consulta ocorre apenas no frontend; o pai recebe o endereço via callback.
 */
import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ViaCepAddress {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: string;
  onChange: (masked: string) => void;
  onAddressResolved?: (addr: ViaCepAddress) => void;
  inputClassName?: string;
}

function maskCep(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export const CepInput = React.forwardRef<HTMLInputElement, Props>(
  ({ value = "", onChange, onAddressResolved, inputClassName, ...rest }, ref) => {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const lastFetchedRef = React.useRef<string>("");
    const errorId = React.useId();
    const statusId = React.useId();

    const digits = value.replace(/\D/g, "");

    React.useEffect(() => {
      if (digits.length !== 8) {
        setError(null);
        return;
      }
      if (lastFetchedRef.current === digits) return;

      const ctrl = new AbortController();
      const timer = setTimeout(async () => {
        lastFetchedRef.current = digits;
        setLoading(true);
        setError(null);
        try {
          const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
            signal: ctrl.signal,
          });
          if (!res.ok) throw new Error("network");
          const json = await res.json();
          if (json?.erro) {
            setError("CEP não encontrado.");
            return;
          }
          onAddressResolved?.({
            logradouro: json.logradouro ?? "",
            bairro: json.bairro ?? "",
            cidade: json.localidade ?? "",
            uf: json.uf ?? "",
          });
        } catch (e) {
          if ((e as Error).name === "AbortError") return;
          setError("Não foi possível consultar o CEP. Tente novamente.");
        } finally {
          setLoading(false);
        }
      }, 300);

      return () => {
        ctrl.abort();
        clearTimeout(timer);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [digits]);

    return (
      <div className="flex flex-col gap-1">
        <div className="relative">
          <input
            ref={ref}
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            value={value}
            onChange={(e) => onChange(maskCep(e.target.value))}
            aria-label="CEP"
            aria-busy={loading}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              "w-full rounded-md border border-input bg-background px-3 py-2 pr-9 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
              inputClassName,
            )}
            {...rest}
          />
          {loading && (
            <Loader2
              aria-hidden
              className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
            />
          )}
        </div>
        <span id={statusId} role="status" aria-live="polite" className="sr-only">
          {loading ? "Consultando CEP…" : ""}
        </span>
        {error && (
          <span id={errorId} role="alert" className="text-xs text-destructive">
            {error}
          </span>
        )}
      </div>
    );
  },
);
CepInput.displayName = "CepInput";
