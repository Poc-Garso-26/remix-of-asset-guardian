import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { AssetsListPage, assetsSearchSchema } from "@/components/assets-list-page";

export const Route = createFileRoute("/_authenticated/ativos/computadores")({
  head: () => ({
    meta: [
      { title: "Computadores — GestãoTI" },
      { name: "description", content: "Lista de computadores cadastrados no inventário de ativos de TI." },
      { property: "og:title", content: "Computadores — GestãoTI" },
      { property: "og:description", content: "Lista de computadores cadastrados no inventário de ativos de TI." },
      { property: "og:url", content: "/ativos/computadores" },
      { name: "twitter:title", content: "Computadores — GestãoTI" },
      { name: "twitter:description", content: "Lista de computadores cadastrados no inventário de ativos de TI." },
    ],
    links: [{ rel: "canonical", href: "/ativos/computadores" }],
  }),
  validateSearch: zodValidator(assetsSearchSchema),
  component: Page,
});

function Page() {
  const search = Route.useSearch();
  return <AssetsListPage search={search} title="Computadores" fixedType="computador" />;
}
