import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { AssetsListPage, assetsSearchSchema } from "@/components/assets-list-page";

export const Route = createFileRoute("/_authenticated/ativos/notebooks")({
  head: () => ({
    meta: [
      { title: "Notebooks — GestãoTI" },
      { name: "description", content: "Lista de notebooks cadastrados no inventário de ativos de TI." },
      { property: "og:title", content: "Notebooks — GestãoTI" },
      { property: "og:description", content: "Lista de notebooks cadastrados no inventário de ativos de TI." },
      { property: "og:url", content: "/ativos/notebooks" },
      { name: "twitter:title", content: "Notebooks — GestãoTI" },
      { name: "twitter:description", content: "Lista de notebooks cadastrados no inventário de ativos de TI." },
    ],
    links: [{ rel: "canonical", href: "/ativos/notebooks" }],
  }),
  validateSearch: zodValidator(assetsSearchSchema),
  component: Page,
});

function Page() {
  const search = Route.useSearch();
  return <AssetsListPage search={search} title="Notebooks" fixedType="notebook" />;
}
