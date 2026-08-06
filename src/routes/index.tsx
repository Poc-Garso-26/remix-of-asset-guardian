import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GestãoTI — Inventário de Ativos de TI" },
      { name: "description", content: "Painel central do GestãoTI: acompanhe computadores, notebooks e impressoras da sua organização." },
      { property: "og:title", content: "GestãoTI — Inventário de Ativos de TI" },
      { property: "og:description", content: "Painel central do GestãoTI: acompanhe computadores, notebooks e impressoras da sua organização." },
      { property: "og:url", content: "/" },
      { name: "twitter:title", content: "GestãoTI — Inventário de Ativos de TI" },
      { name: "twitter:description", content: "Painel central do GestãoTI: acompanhe computadores, notebooks e impressoras da sua organização." },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: () => <Navigate to="/dashboard" replace />,
});
