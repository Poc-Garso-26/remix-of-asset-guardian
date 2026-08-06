import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { AssetsListPage, assetsSearchSchema } from "@/components/assets-list-page";

export const Route = createFileRoute("/_authenticated/ativos/impressoras")({
  head: () => ({
    meta: [
      { title: "Impressoras — GestãoTI" },
      { name: "description", content: "Lista de impressoras cadastradas no inventário de ativos de TI." },
      { property: "og:title", content: "Impressoras — GestãoTI" },
      { property: "og:description", content: "Lista de impressoras cadastradas no inventário de ativos de TI." },
      { property: "og:url", content: "/ativos/impressoras" },
      { name: "twitter:title", content: "Impressoras — GestãoTI" },
      { name: "twitter:description", content: "Lista de impressoras cadastradas no inventário de ativos de TI." },
    ],
    links: [{ rel: "canonical", href: "/ativos/impressoras" }],
  }),
  validateSearch: zodValidator(assetsSearchSchema),
  component: Page,
});

function Page() {
  const search = Route.useSearch();
  return <AssetsListPage search={search} title="Impressoras" fixedType="impressora" />;
}
