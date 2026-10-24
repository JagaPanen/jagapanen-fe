import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PlannerPage } from "@/components/panenroute/PlannerPage";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => {
    const raw = (search["tab"] as string)?.toLowerCase();
    let tab: "comparison" | "map" = "comparison";
    if (raw === "map" || raw === "peta") {
      tab = "map";
    } else if (raw === "comparison" || raw === "komparasi") {
      tab = "comparison";
    } else if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("jagapanen_active_tab");
        if (cached === "map" || cached === "comparison") {
          tab = cached as "comparison" | "map";
        }
      } catch {
        // Fallback
      }
    }
    return { tab };
  },
  head: () => ({
    meta: [{ title: "JagaPanen" }],
  }),
  component: Index,
});

function Index() {
  const { tab: activeTab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <PlannerPage
      forceGuest={false}
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
