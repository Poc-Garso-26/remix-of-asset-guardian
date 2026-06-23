/**
 * Utilitário de exportação de PDF.
 *
 * Gera relatórios em formato A4 (retrato) com cabeçalho corporativo,
 * filtros aplicados, tabela completa e paginação no rodapé.
 *
 * Para alterar o layout (logo, cores, fontes) ajuste as constantes abaixo.
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ASSET_STATUS_LABEL,
  ASSET_TYPE_LABEL,
  type Asset,
} from "./assets-types";
import type { AssetFilters } from "./assets-service";

const BRAND = "GestãoTI";
const SUBTITLE = "Sistema de Gestão de Ativos de TI";

interface ExportOptions {
  title: string;
  assets: Asset[];
  filters?: AssetFilters;
  generatedBy?: string;
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR");
}

function describeFilters(f: AssetFilters = {}): string[] {
  const out: string[] = [];
  if (f.type && f.type !== "all") out.push(`Tipo: ${ASSET_TYPE_LABEL[f.type]}`);
  if (f.status && f.status !== "all") out.push(`Situação: ${ASSET_STATUS_LABEL[f.status]}`);
  if (f.patrimony) out.push(`Patrimônio: ${f.patrimony}`);
  if (f.serialNumber) out.push(`Nº de série: ${f.serialNumber}`);
  if (f.brand) out.push(`Marca: ${f.brand}`);
  if (f.model) out.push(`Modelo: ${f.model}`);
  if (f.responsible) out.push(`Responsável: ${f.responsible}`);
  if (f.sector) out.push(`Setor: ${f.sector}`);
  if (f.operatingSystem) out.push(`SO: ${f.operatingSystem}`);
  if (f.createdFrom || f.createdTo)
    out.push(`Cadastro: ${fmtDate(f.createdFrom)} → ${fmtDate(f.createdTo)}`);
  if (f.acquiredFrom || f.acquiredTo)
    out.push(`Aquisição: ${fmtDate(f.acquiredFrom)} → ${fmtDate(f.acquiredTo)}`);
  if (f.q) out.push(`Pesquisa: "${f.q}"`);
  return out;
}

export function exportAssetsPdf(opts: ExportOptions): void {
  const { title, assets, filters, generatedBy } = opts;

  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;

  // Cabeçalho
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageW, 64, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(BRAND, margin, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(SUBTITLE, margin, 46);

  doc.setFontSize(9);
  const generatedAt = new Date().toLocaleString("pt-BR");
  doc.text(`Emitido em ${generatedAt}`, pageW - margin, 30, { align: "right" });
  if (generatedBy) doc.text(`Por ${generatedBy}`, pageW - margin, 46, { align: "right" });

  // Título do relatório
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, margin, 92);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`${assets.length} registro(s)`, margin, 108);

  // Filtros aplicados
  const filterLines = describeFilters(filters);
  let cursorY = 128;
  if (filterLines.length) {
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Filtros aplicados:", margin, cursorY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    const wrapped = doc.splitTextToSize(filterLines.join("  •  "), pageW - margin * 2);
    doc.text(wrapped, margin, cursorY + 12);
    cursorY += 12 + wrapped.length * 11;
  }

  // Tabela
  autoTable(doc, {
    startY: cursorY + 8,
    margin: { left: margin, right: margin, bottom: 50 },
    head: [["Patrimônio", "Tipo", "Marca/Modelo", "Responsável", "Setor", "Situação", "Aquisição"]],
    body: assets.map((a) => [
      a.patrimony,
      ASSET_TYPE_LABEL[a.type],
      `${a.brand} ${a.model}`,
      a.responsible,
      a.sector,
      ASSET_STATUS_LABEL[a.status],
      fmtDate(a.acquisitionDate),
    ]),
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 5, textColor: [15, 23, 42] },
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 250, 252] },
    columnStyles: {
      0: { cellWidth: 70, font: "courier" },
      5: { cellWidth: 60 },
      6: { cellWidth: 60 },
    },
    didDrawPage: () => {
      const pageNumber = doc.getCurrentPageInfo().pageNumber;
      const totalPages = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `${BRAND} — Confidencial`,
        margin,
        pageH - 20,
      );
      doc.text(
        `Página ${pageNumber} de ${totalPages}`,
        pageW - margin,
        pageH - 20,
        { align: "right" },
      );
    },
  });

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`${slug || "relatorio"}-${stamp}.pdf`);
}
