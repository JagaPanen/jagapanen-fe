import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PlannerPage } from "@/components/panenroute/PlannerPage";

export const Route = createFileRoute("/demo")({
  validateSearch: (search: Record<string, unknown>) => {
    const raw = (search["tab"] as string)?.toLowerCase();
    let tab: "comparison" | "map" = "comparison";
    if (raw === "map" || raw === "peta") tab = "map";
    else if (raw === "comparison" || raw === "komparasi") tab = "comparison";
    return { tab };
  },
  head: () => ({
    meta: [{ title: "Panenlink Demo" }],
  }),
  component: DemoPage,
});

function DemoPage() {
  const { tab: activeTab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <PlannerPage
      mode="guest"
      forceGuest
      activeTab={activeTab}
      onTabChange={(newTab) => {
        navigate({
          search: (prev) => ({ ...prev, tab: newTab }),
          replace: true,
        });
      }}
    />
  );
}
