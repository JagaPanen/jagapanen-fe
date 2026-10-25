import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PlannerPage } from "@/components/panenroute/PlannerPage";

export const Route = createFileRoute("/app/scenarios/$scenarioId")({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    tab: "comparison" | "map";
    runId?: string;
  } => {
    const raw = (search["tab"] as string)?.toLowerCase();
    let tab: "comparison" | "map" = "comparison";
    if (raw === "map" || raw === "peta") tab = "map";
    else if (raw === "comparison" || raw === "komparasi") tab = "comparison";
    const runId = typeof search["runId"] === "string" ? search["runId"] : undefined;
    return runId !== undefined ? { tab, runId } : { tab };
  },
  head: () => ({ meta: [{ title: "Planner — Panenlink App" }] }),
  component: OrgPlannerRoute,
});

function OrgPlannerRoute() {
  const { scenarioId } = Route.useParams();
  const { tab: activeTab, runId } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <PlannerPage
      mode="org"
      scenarioId={scenarioId}
      initialRunId={runId}
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
