import { createFileRoute } from "@tanstack/react-router";
import { AssetForm } from "@/components/asset-form";

export const Route = createFileRoute("/qa-asset-form")({
  head: () => ({ meta: [{ title: "QA — Formulário de ativo" }] }),
  component: () => (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl">QA formulário</h1>
      <AssetForm
        initial={{ patrimony: "", serialNumber: "", brand: "", model: "", sector: "", responsible: "", location: "" }}
        submitLabel="Salvar"
        onSubmit={async () => {
          (window as unknown as { __submitted?: boolean }).__submitted = true;
        }}
      />
    </main>
  ),
});
