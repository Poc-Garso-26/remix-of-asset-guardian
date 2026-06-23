import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { AssetsListPage, assetsSearchSchema } from "@/components/assets-list-page";

export const Route = createFileRoute("/_authenticated/ativos/computadores")({
  head: () => ({ meta: [{ title: "Computadores — GestãoTI" }] }),
  validateSearch: zodValidator(assetsSearchSchema),
  component: Page,
});

function Page() {
  const search = Route.useSearch();
  return <AssetsListPage search={search} title="Computadores" fixedType="computador" />;
}
