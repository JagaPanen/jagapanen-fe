import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Database, RefreshCw, Layers, Play } from "lucide-react";
import { RouteMap } from "@/components/panenroute/RouteMap";
import { HarvestTable } from "@/components/panenroute/HarvestTable";
import { FormulaDialog, AddHarvestDialog } from "@/components/panenroute/Dialogs";
import { ComparisonView } from "@/components/panenroute/ComparisonView";
import { CommodityAdminDialog } from "@/components/panenroute/CommodityAdminDialog";
import { TestReportDialog } from "@/components/panenroute/TestReportDialog";
import { GuestBanner } from "@/components/panenroute/GuestBanner";
import { VEHICLE, type Harvest, type Mode } from "@/components/panenroute/data";
import { clearAuthSession, getAccessToken, getAuthMeta, isGuestSession } from "@/lib/auth-session";
import {
  API_BASE_URL,
  getCommodities,
  getHarvests,
  probeBackend,
  deleteHarvest,
  backendHarvestToFrontend,
  EMPTY_COMPARISON,
  createDemoSession,
  runOptimization,
  mapOptimizationResponse,
  isUuidLike,
  type ComparisonData,
} from "@/services/api";
import { toast } from "sonner";

export function PlannerPage({
  forceGuest = false,
  activeTab = "comparison",
  onTabChange,
}: {
  forceGuest?: boolean;
  activeTab?: "comparison" | "map";
  onTabChange?: (tab: "comparison" | "map") => void;
}) {
  const navigate = useNavigate();
  const [mode] = useState<Mode>("spoilage");
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [isHarvestsLoading, setIsHarvestsLoading] = useState<boolean>(true);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [guestMode, setGuestMode] = useState(forceGuest);
  const [runsRemaining, setRunsRemaining] = useState<number | null>(null);

  const handleTabChange = (newTab: "comparison" | "map") => {
    onTabChange?.(newTab);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("jagapanen_active_tab", newTab);
      } catch {
        // Safe localStorage
      }
    }
  };

  const applyHarvests = useCallback((nextHarvests: Harvest[]) => {
    setHarvests(nextHarvests);
    setComparisonData(EMPTY_COMPARISON);
  }, []);

  const loadHarvestsFromBackend = useCallback(
    async (activeScenarioId: string) => {
      setIsHarvestsLoading(true);
      try {
        const [backendItems, catalog] = await Promise.all([
          getHarvests(activeScenarioId),
          getCommodities(),
        ]);
        const mapped = Array.isArray(backendItems)
          ? backendItems.map((item) => backendHarvestToFrontend(item, catalog))
          : [];
        applyHarvests(mapped);
        return mapped;
      } catch (err) {
        console.error("[JagaPanen] Harvest load failed:", err);
        setComparisonData(EMPTY_COMPARISON);
        return null;
      } finally {
        setIsHarvestsLoading(false);
      }
    },
    [applyHarvests],
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        if (forceGuest) {
          clearAuthSession();
        }
        const existing = getAccessToken();
        const meta = getAuthMeta();
        let activeScenarioId = meta?.scenarioId ?? null;

        if (!existing || forceGuest || !activeScenarioId) {
          const session = await createDemoSession();
          if (cancelled) return;
          activeScenarioId = session.scenario_id ?? null;
          setGuestMode(true);
          setRunsRemaining(
            typeof session.runs_remaining === "number" ? session.runs_remaining : 5,
          );
        } else {
          setGuestMode(isGuestSession() || forceGuest);
          setRunsRemaining(
            typeof meta?.runsRemaining === "number" ? meta.runsRemaining : null,
          );
        }

        if (!activeScenarioId) {
          throw new Error("Demo session did not return scenario_id");
        }

        await probeBackend();
        if (cancelled) return;
        setScenarioId(activeScenarioId);
        setBackendError(null);
        setIsBackendConnected(true);
        await loadHarvestsFromBackend(activeScenarioId);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        console.error("[JagaPanen] Backend check failed. API base:", API_BASE_URL, err);
        setBackendError(message);
        setIsBackendConnected(false);
        setScenarioId(null);
        setComparisonData(EMPTY_COMPARISON);
        setIsHarvestsLoading(false);
        toast.error("Backend tidak terjangkau", { description: message });
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [forceGuest, loadHarvestsFromBackend]);

  const totalVolume = harvests.reduce((s, h) => s + h.volume, 0);
  const isOverload = !isHarvestsLoading && totalVolume > VEHICLE.kapasitas;

  const handleRunOptimization = async () => {
    if (!isBackendConnected || !scenarioId) {
      toast.error("Optimasi gagal", {
        description: "Backend tidak terhubung atau skenario belum siap.",
      });
      setComparisonData(EMPTY_COMPARISON);
      return;
    }
    if (harvests.length === 0) {
      toast.error("Optimasi gagal", { description: "Belum ada data panen untuk dioptimalkan." });
      setComparisonData(EMPTY_COMPARISON);
      return;
    }

    setIsCalculating(true);
    try {
      const raw = await runOptimization(scenarioId, "spoilage_priority");
      const mapped = mapOptimizationResponse(raw, harvests);
      setComparisonData(mapped);
      if (guestMode && typeof runsRemaining === "number") {
        const next = Math.max(0, runsRemaining - 1);
        setRunsRemaining(next);
        const meta = getAuthMeta();
        if (meta) {
          const { setAuthSession } = await import("@/lib/auth-session");
          const token = getAccessToken();
          if (token) {
            setAuthSession(token, {
              ...meta,
              runsRemaining: next,
              runsUsed: (meta.runsUsed ?? 0) + 1,
            });
          }
        }
      }
      toast.success("Rute berhasil dihitung dari backend");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("[JagaPanen] Optimasi gagal:", e);
      setComparisonData(EMPTY_COMPARISON);
      toast.error("Optimasi gagal", { description: message });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-slate-50 text-zinc-900 flex flex-col">
      {guestMode ? <GuestBanner runsRemaining={runsRemaining} /> : null}
      <header className="w-full border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 sm:px-5 py-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="JagaPanen - Spoilage-Aware Agri-Logistics"
              className="h-10 sm:h-12 w-auto object-contain flex-shrink-0"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Badge
              variant="outline"
              className="border-slate-200 rounded-full px-2.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-slate-600 bg-slate-50/50"
            >
              {guestMode ? "Guest Demo" : "Pilot: Koperasi Tani Maju Bersama"}
            </Badge>
            <Badge
              variant="outline"
              className={
                isBackendConnected
                  ? "border-emerald-200 bg-emerald-50 rounded-full px-2.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-emerald-700"
                  : "border-amber-200 bg-amber-50 rounded-full px-2.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-amber-700"
              }
            >
              {isBackendConnected ? (
                <>
                  <ShieldCheck className="mr-1 h-3 w-3 shrink-0" /> Backend Active
                </>
              ) : (
                <>
                  <Database className="mr-1 h-3 w-3 shrink-0" /> Offline
                </>
              )}
            </Badge>
          </div>
        </div>
        {backendError && (
          <div className="mx-auto w-full max-w-[1600px] px-3.5 sm:px-5 pb-3 text-[11px] leading-snug text-amber-800 break-all">
            API {API_BASE_URL}: {backendError}
          </div>
        )}
      </header>

      <div className="sticky top-0 z-10 w-full border-b border-slate-200 bg-white/95 backdrop-blur px-3 sm:px-5 py-2 sm:py-2.5">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 w-full sm:w-auto">
              <button
                onClick={() => handleTabChange("comparison")}
                className={`flex-1 sm:flex-none justify-center rounded-md px-2.5 sm:px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === "comparison"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <Layers className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Komparasi Skenario</span>
                <span className="sm:hidden">Komparasi</span>
              </button>
              <button
                onClick={() => handleTabChange("map")}
                className={`flex-1 sm:flex-none justify-center rounded-md px-2.5 sm:px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === "map"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Peta Penjemputan</span>
                <span className="sm:hidden">Peta</span>
              </button>
            </div>

            <Button
              size="sm"
              onClick={handleRunOptimization}
              disabled={
                isCalculating ||
                isHarvestsLoading ||
                isOverload ||
                harvests.length === 0 ||
                !isBackendConnected ||
                !scenarioId
              }
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 shrink-0 justify-center rounded-lg shadow-sm"
            >
              <Play className="mr-1.5 h-3.5 w-3.5 shrink-0" />
              {isCalculating
                ? "Menghitung Rute..."
                : isHarvestsLoading
                  ? "Memuat Data..."
                  : "Kalkulasi Ulang Rute"}
            </Button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 w-full lg:w-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => navigate({ to: "/demo" })}
            >
              /demo
            </Button>
            <CommodityAdminDialog />
            <TestReportDialog />
            <FormulaDialog />
            <AddHarvestDialog
              scenarioId={scenarioId}
              isBackendConnected={isBackendConnected}
              onAdd={(h) => {
                setHarvests((p) => [...p, h]);
                setComparisonData(EMPTY_COMPARISON);
              }}
              onAddSuccess={async () => {
                if (scenarioId) await loadHarvestsFromBackend(scenarioId);
              }}
            />
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-4 px-3 sm:px-5 py-3 sm:py-4">
        {isOverload && (
          <div className="w-full p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl shadow-sm">
            ⚠️{" "}
            <strong>
              Kapasitas Armada Terlampaui ({totalVolume} kg / {VEHICLE.kapasitas} kg).
            </strong>{" "}
            Hapus salah satu baris panen di tabel agar kapasitas kembali aman.
          </div>
        )}

        {activeTab === "comparison" ? (
          <ComparisonView data={comparisonData} isLoading={isHarvestsLoading || isCalculating} />
        ) : (
          <div className="w-full border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
            <RouteMap harvests={harvests} mode={mode} />
          </div>
        )}

        <HarvestTable
          harvests={harvests}
          isLoading={isHarvestsLoading}
          isBackendConnected={isBackendConnected}
          onReload={async () => {
            if (scenarioId) await loadHarvestsFromBackend(scenarioId);
          }}
          onDelete={async (id) => {
            if (isBackendConnected && isUuidLike(id)) {
              const ok = await deleteHarvest(id);
              if (!ok) {
                toast.error("Gagal menghapus panen", {
                  description: "Backend menolak atau tidak merespons DELETE.",
                });
                if (scenarioId) await loadHarvestsFromBackend(scenarioId);
                return;
              }
              toast.success("Data panen berhasil dihapus dari database");
              if (scenarioId) await loadHarvestsFromBackend(scenarioId);
              return;
            }

            applyHarvests(harvests.filter((item) => item.id !== id));
            if (isBackendConnected) {
              toast.error("Gagal menghapus panen", {
                description: "ID panen bukan UUID backend; tidak ada DELETE yang dikirim.",
              });
            }
          }}
          onUpdate={(updatedHarvest) => {
            setHarvests((prev) =>
              prev.map((item) => (item.id === updatedHarvest.id ? updatedHarvest : item)),
            );
            setComparisonData(EMPTY_COMPARISON);
          }}
        />
      </main>
    </div>
  );
}
