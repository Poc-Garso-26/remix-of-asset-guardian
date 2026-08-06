import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { AssetsListPage, assetsSearchSchema } from "@/components/assets-list-page";

export const Route = createFileRoute("/_authenticated/ativos/")({
  head: () => ({
    meta: [
      { title: "Ativos — GestãoTI" },
      { name: "description", content: "Consulte, filtre e ordene todos os ativos de TI cadastrados no inventário." },
      { property: "og:title", content: "Ativos — GestãoTI" },
      { property: "og:description", content: "Consulte, filtre e ordene todos os ativos de TI cadastrados no inventário." },
      { property: "og:url", content: "/ativos" },
      { name: "twitter:title", content: "Ativos — GestãoTI" },
      { name: "twitter:description", content: "Consulte, filtre e ordene todos os ativos de TI cadastrados no inventário." },
    ],
    links: [{ rel: "canonical", href: "/ativos" }],
  }),
  validateSearch: zodValidator(assetsSearchSchema),
  component: Page,
});

function Page() {
  const search = Route.useSearch();
  return <AssetsListPage search={search} title="Todos os ativos" />;
}
