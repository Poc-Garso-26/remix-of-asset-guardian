/**
 * pdfSafeText / formatFileSize — normalização de texto e tamanho de arquivo
 * usados na geração dos relatórios PDF. Funções puras, sem I/O.
 */
import { describe, expect, it } from "vitest";
import { formatFileSize, pdfSafeText } from "@/lib/pdf-export";

describe("pdfSafeText", () => {
  it("converte travessões e hifens tipográficos em hífen simples", () => {
    expect(pdfSafeText("GestãoTI — Confidencial")).toBe("GestãoTI - Confidencial");
    expect(pdfSafeText("2026\u20132027")).toBe("2026-2027");
    expect(pdfSafeText("\u2212 5")).toBe("- 5");
  });

  it("converte setas e bullets", () => {
    expect(pdfSafeText("01/08 \u2192 07/08")).toBe("01/08 > 07/08");
    expect(pdfSafeText("Tipo \u2022 Setor")).toBe("Tipo | Setor");
  });

  it("converte aspas curvas, reticências e espaço fixo", () => {
    expect(pdfSafeText("\u201cnotebook\u201d")).toBe('"notebook"');
    expect(pdfSafeText("\u2018teste\u2019")).toBe("'teste'");
    expect(pdfSafeText("continua\u2026")).toBe("continua...");
    expect(pdfSafeText("PAT\u00A0001")).toBe("PAT 001");
  });

  it("preserva acentos e cedilha", () => {
    expect(pdfSafeText("Aquisição, Manutenção, Patrimônio, Número")).toBe(
      "Aquisição, Manutenção, Patrimônio, Número",
    );
  });

  it("trata valores não string", () => {
    expect(pdfSafeText(null)).toBe("");
    expect(pdfSafeText(undefined)).toBe("");
    expect(pdfSafeText(42)).toBe("42");
    expect(pdfSafeText(true)).toBe("true");
  });
});

describe("formatFileSize", () => {
  it("formata KB", () => {
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(500)).toBe("1 KB");
  });

  it("formata MB no padrão pt-BR", () => {
    expect(formatFileSize(1.4 * 1024 * 1024)).toBe("1,4 MB");
  });

  it("indica tamanho indisponível para valores inválidos", () => {
    expect(formatFileSize(0)).toBe("tamanho indisponível");
    expect(formatFileSize(-10)).toBe("tamanho indisponível");
  });
});
