import { exportAssetsPdf } from "../src/lib/pdf-export";
import fs from "fs";
// stub jsPDF save via monkeypatch of Blob->file: capture output
import jsPDF from "jspdf";

(jsPDF as any).API.save = function (name: string) {
  const ab = this.output("arraybuffer");
  fs.writeFileSync("/dev-server/tmp-pdftest/" + name, Buffer.from(ab));
  console.log("saved", name);
};
const assets = [{ id: "1", patrimony: "PAT-00102", type: "computador", brand: "Dell — “X”", model: "OptiPlex", responsible: "João Ção", sector: "TI", status: "em_uso", acquisitionDate: "2026-08-01" }] as any;
const r = exportAssetsPdf({ title: "Relatório de ativos", assets, filters: { acquiredFrom: "2026-08-01", acquiredTo: "2026-08-07", q: "dell", type: "all", status: "all" } as any, generatedBy: "Coordenação — TI" });
console.log(r);
