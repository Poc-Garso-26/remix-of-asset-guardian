/**
 * Conversões de data do DateField — ISO <-> dd/mm/aaaa sem deslocamento de
 * fuso horário (regressão corrigida anteriormente) e máscara de digitação.
 */
import { describe, expect, it } from "vitest";
import { brToIso, isoToBr, isoToLocalDate, mask, toIso } from "@/components/date-field";

describe("isoToLocalDate", () => {
  it("interpreta ISO como data local (sem voltar um dia)", () => {
    const d = isoToLocalDate("2026-08-01")!;
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7);
    expect(d.getDate()).toBe(1);
  });

  it("rejeita formatos inválidos", () => {
    expect(isoToLocalDate("")).toBeUndefined();
    expect(isoToLocalDate("01/08/2026")).toBeUndefined();
    expect(isoToLocalDate("2026-8-1")).toBeUndefined();
  });
});

describe("toIso / isoToBr", () => {
  it("faz ida e volta preservando o dia", () => {
    expect(toIso(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(isoToBr("2026-01-05")).toBe("05/01/2026");
    expect(isoToBr("2026-12-31")).toBe("31/12/2026");
  });

  it("retorna vazio para ISO inválido", () => {
    expect(isoToBr("")).toBe("");
    expect(isoToBr("abc")).toBe("");
  });
});

describe("brToIso", () => {
  it("converte data completa", () => {
    expect(brToIso("07/08/2026")).toBe("2026-08-07");
  });

  it("retorna vazio para data incompleta ou inexistente", () => {
    expect(brToIso("07/08")).toBe("");
    expect(brToIso("31/02/2026")).toBe("");
    expect(brToIso("32/01/2026")).toBe("");
    expect(brToIso("00/00/0000")).toBe("");
  });
});

describe("mask", () => {
  it("aplica dd/mm/aaaa progressivamente", () => {
    expect(mask("0")).toBe("0");
    expect(mask("07")).toBe("07");
    expect(mask("0708")).toBe("07/08");
    expect(mask("07082026")).toBe("07/08/2026");
  });

  it("descarta caracteres não numéricos e excedentes", () => {
    expect(mask("07/08/2026")).toBe("07/08/2026");
    expect(mask("07a08b2026999")).toBe("07/08/2026");
  });
});
