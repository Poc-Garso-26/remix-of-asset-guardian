import { exportAssetsPdf } from "./__pdfchk";
const a: any = [{patrimony:"PAT-00101",type:"computador",brand:"Dell",model:"OptiPlex",responsible:"Ana",sector:"TI",status:"estoque",acquisitionDate:"2026-08-01"}];
const r = exportAssetsPdf({ title: "Relatorio de ativos", assets: a, filters: { acquiredFrom:"2026-08-01", acquiredTo:"2026-08-07" }, generatedBy: "Teste" } as any);
console.log(r);
