import { useCallback, useEffect, useMemo, useState } from "react";
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
import { PlanningPanel } from "@/components/panenroute/PlanningPanel";
import { type Harvest, type Mode } from "@/components/panenroute/data";
import { clearAuthSession, getAccessToken, getAuthMeta, isGuestSession } from "@/lib/auth-session";
import {
  API_BASE_URL,
  getCommodities,
  getHarvests,
  getScenario,
  probeBackend,
  deleteHarvest,
  backendHarvestToFrontend,
  EMPTY_COMPARISON,
  createDemoSession,
  runOptimization,
  mapOptimizationResponse,
  isUuidLike,
  scoreRisk,
  previewOptimization,
  resetScenarioToDraft,
  type ComparisonData,
  type FeasibilityPreviewResponse,
  type RiskScoreResponse,
  type Vehicle,
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
  const [scenarioStatus, setScenarioStatus] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [guestMode, setGuestMode] = useState(forceGuest);
  const [runsRemaining, setRunsRemaining] = useState<number | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [risk, setRisk] = useState<RiskScoreResponse | null>(null);
  const [preview, setPreview] = useState<FeasibilityPreviewResponse | null>(null);
  const [scored, setScored] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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

  const clearPlanningDerived = useCallback(() => {
    setRisk(null);
    setPreview(null);
    setScored(false);
    setSelectedVehicleId(null);
    setComparisonData(EMPTY_COMPARISON);
  }, []);

  const applyHarvests = useCallback(
    (nextHarvests: Harvest[]) => {
      setHarvests(nextHarvests);
      clearPlanningDerived();
    },
    [clearPlanningDerived],
  );

  const refreshScenarioStatus = useCallback(async (id: string) => {
    try {
      const s = await getScenario(id);
      setScenarioStatus(s.status);
      return s;
    } catch (err) {
      console.error("[JagaPanen] Scenario status load failed:", err);
      return null;
    }
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
        await refreshScenarioStatus(activeScenarioId);
        return mapped;
      } catch (err) {
        console.error("[JagaPanen] Harvest load failed:", err);
        setComparisonData(EMPTY_COMPARISON);
        return null;
      } finally {
        setIsHarvestsLoading(false);
      }
    },
    [applyHarvests, refreshScenarioStatus],
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
          setRunsRemaining(typeof session.runs_remaining === "number" ? session.runs_remaining : 5);
        } else {
          setGuestMode(isGuestSession() || forceGuest);
          setRunsRemaining(typeof meta?.runsRemaining === "number" ? meta.runsRemaining : null);
        }

        if (!activeScenarioId) {
          throw new Error("Demo session did not return scenario_id");
        }

        const probed = await probeBackend();
        if (cancelled) return;
        setVehicles(probed.vehicles);
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

  const selectedCapacity = useMemo(() => {
    const v = vehicles.find((item) => item.id === selectedVehicleId);
    return v?.capacity_kg ?? null;
  }, [vehicles, selectedVehicleId]);

  const totalVolume = harvests.reduce((s, h) => s + h.volume, 0);
  const isOverload =
    !isHarvestsLoading && selectedCapacity != null && totalVolume > selectedCapacity;

  const canOptimize =
    isBackendConnected &&
    !!scenarioId &&
    harvests.length > 0 &&
    scored &&
    !!preview &&
    !!selectedVehicleId &&
    !isOverload &&
    scenarioStatus !== "completed" &&
    scenarioStatus !== "optimizing";

  const handleScoreRisk = async () => {
    if (!scenarioId || harvests.length === 0) {
      toast.error("Skor risiko gagal", { description: "Belum ada data panen." });
      return;
    }
    const ids = harvests.map((h) => h.id).filter(isUuidLike);
    if (ids.length === 0) {
      toast.error("Skor risiko gagal", { description: "ID panen bukan UUID backend." });
      return;
    }
    setIsScoring(true);
    try {
      const res = await scoreRisk(ids);
      setRisk(res);
      setScored(true);
      setPreview(null);
      setSelectedVehicleId(null);
      setComparisonData(EMPTY_COMPARISON);
      const byId = new Map(res.results.map((r) => [r.harvest_id, r]));
      setHarvests((prev) =>
        prev.map((h) => {
          const r = byId.get(h.id);
          if (!r) return h;
          return {
            ...h,
            urgency: r.urgency_score,
            priorityLevel: r.priority_level,
            maxTransitHours: r.recommended_max_transit_hours,
            jamSejakPanen: Math.round(r.time_since_harvest_hours),
          };
        }),
      );
      toast.success(`Risiko dihitung (${res.count} panen)`);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setRisk(null);
      setScored(false);
      toast.error("Skor risiko gagal", { description: message });
    } finally {
      setIsScoring(false);
    }
  };

  const handlePreview = async () => {
    if (!scenarioId) return;
    if (!scored) {
      toast.error("Preview ditolak", { description: "Hitung risiko dulu sebelum preview." });
      return;
    }
    setIsPreviewing(true);
    try {
      const res = await previewOptimization(scenarioId);
      setPreview(res);
      setSelectedVehicleId(res.feasible_vehicles[0]?.vehicle_id ?? null);
      setComparisonData(EMPTY_COMPARISON);
      await refreshScenarioStatus(scenarioId);
      if (res.feasible_vehicles.length === 0) {
        toast.error("Tidak ada armada feasible", {
          description: res.rejected_vehicles[0]?.reasons[0] ?? "Semua truk ditolak.",
        });
      } else {
        toast.success(
          `Preview: ${res.feasible_vehicles.length} feasible, ${res.rejected_vehicles.length} rejected`,
        );
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setPreview(null);
      setSelectedVehicleId(null);
      setComparisonData(EMPTY_COMPARISON);
      toast.error("Preview gagal", { description: message });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleResetDraft = async () => {
    if (!scenarioId) return;
    setIsResetting(true);
    try {
      const s = await resetScenarioToDraft(scenarioId);
      setScenarioStatus(s.status);
      clearPlanningDerived();
      toast.success("Skenario dikembalikan ke draft");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error("Reset gagal", { description: message });
    } finally {
      setIsResetting(false);
    }
  };

  const handleRunOptimization = async () => {
    if (!isBackendConnected || !scenarioId) {
      toast.error("Optimasi gagal", {
        description: "Backend tidak terhubung atau skenario belum siap.",
      });
      setComparisonData(EMPTY_COMPARISON);
      return;
    }
    if (!scored || !preview || !selectedVehicleId) {
      toast.error("Optimasi gagal", {
        description: "Urutan wajib: skor risiko → preview → pilih truk.",
      });
      setComparisonData(EMPTY_COMPARISON);
      return;
    }
    if (harvests.length === 0) {
      toast.error("Optimasi gagal", { description: "Belum ada data panen untuk dioptimalkan." });
      setComparisonData(EMPTY_COMPARISON);
      return;
    }
    if (isOverload) {
      toast.error("Optimasi gagal", {
        description: "Volume melebihi kapasitas armada yang dipilih.",
      });
      setComparisonData(EMPTY_COMPARISON);
      return;
    }

    setIsCalculating(true);
    setScenarioStatus("optimizing");
    try {
      const raw = await runOptimization(scenarioId, "spoilage_priority", selectedVehicleId);
      const fleetVehicle = vehicles.find((v) => v.id === selectedVehicleId);
      const mapped = mapOptimizationResponse(
        raw,
        harvests,
        fleetVehicle
          ? {
              vehicleLabel: `${fleetVehicle.name} (${fleetVehicle.capacity_kg.toLocaleString("id-ID")} kg)`,
            }
          : undefined,
      );
      setComparisonData(mapped);
      setScenarioStatus("completed");
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
      await refreshScenarioStatus(scenarioId);
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
              disabled={isCalculating || isHarvestsLoading || !canOptimize}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 shrink-0 justify-center rounded-lg shadow-sm"
            >
              <Play className="mr-1.5 h-3.5 w-3.5 shrink-0" />
              {isCalculating
                ? "Menghitung Rute..."
                : isHarvestsLoading
                  ? "Memuat Data..."
                  : "4. Jalankan Optimasi"}
            </Button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 w-full lg:w-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => navigate({ to: "/demo", search: { tab: "comparison" } })}
            >
              /demo
            </Button>
            <CommodityAdminDialog />
            <TestReportDialog />
            <FormulaDialog />
            <AddHarvestDialog
              scenarioId={scenarioId}
              isBackendConnected={isBackendConnected && scenarioStatus !== "completed"}
              onAdd={(h) => {
                setHarvests((p) => [...p, h]);
                clearPlanningDerived();
              }}
              onAddSuccess={async () => {
                if (scenarioId) await loadHarvestsFromBackend(scenarioId);
              }}
            />
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-4 px-3 sm:px-5 py-3 sm:py-4">
        {isBackendConnected ? (
          <PlanningPanel
            scenarioStatus={scenarioStatus}
            risk={risk}
            preview={preview}
            vehicles={vehicles}
            selectedVehicleId={selectedVehicleId}
            totalVolumeKg={totalVolume}
            isScoring={isScoring}
            isPreviewing={isPreviewing}
            isResetting={isResetting}
            scored={scored}
            canScore={!isHarvestsLoading && harvests.length > 0 && !!scenarioId && !isScoring}
            canPreview={scored && !!scenarioId && !isPreviewing && harvests.length > 0}
            onScore={handleScoreRisk}
            onPreview={handlePreview}
            onReset={handleResetDraft}
            onSelectVehicle={setSelectedVehicleId}
          />
        ) : null}

        {isOverload && selectedCapacity != null && (
          <div className="w-full p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl shadow-sm">
            <strong>
              Kapasitas armada terlampaui ({totalVolume} kg / {selectedCapacity} kg).
            </strong>{" "}
            Pilih truk lain yang feasible atau kurangi volume panen.
          </div>
        )}

        {scenarioStatus === "completed" && (
          <div className="w-full p-3 bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded-xl">
            Skenario <strong>completed</strong>. Gunakan <em>Reset ke Draft</em> untuk mengedit
            panen lagi, lalu ulang skor → preview → pilih truk → optimasi.
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
            clearPlanningDerived();
          }}
        />
      </main>
    </div>
  );
}
