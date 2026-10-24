import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PlannerPage } from "@/components/panenroute/PlannerPage";

export const Route = createFileRoute("/app/scenarios/$scenarioId")({
  validateSearch: (search: Record<string, unknown>) => {
    const raw = (search["tab"] as string)?.toLowerCase();
    let tab: "comparison" | "map" = "comparison";
    if (raw === "map" || raw === "peta") tab = "map";
    else if (raw === "comparison" || raw === "komparasi") tab = "comparison";
    return { tab };
  },
  head: () => ({ meta: [{ title: "Planner — JagaPanen App" }] }),
  component: OrgPlannerRoute,
});

function OrgPlannerRoute() {
  const { scenarioId } = Route.useParams();
  const { tab: activeTab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <PlannerPage
      mode="org"
      scenarioId={scenarioId}
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
