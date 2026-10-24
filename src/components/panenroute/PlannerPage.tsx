import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Database, RefreshCw, Layers, Play, FileDown } from "lucide-react";
import { RouteMap } from "@/components/panenroute/RouteMap";
import { HarvestTable } from "@/components/panenroute/HarvestTable";
import { FormulaDialog, AddHarvestDialog } from "@/components/panenroute/Dialogs";
import { ComparisonView } from "@/components/panenroute/ComparisonView";
import { CommodityAdminDialog } from "@/components/panenroute/CommodityAdminDialog";
import { TestReportDialog } from "@/components/panenroute/TestReportDialog";
import { GuestBanner } from "@/components/panenroute/GuestBanner";
import { ConvertToSignupModal } from "@/components/panenroute/ConvertToSignupModal";
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
  mapRunDetailToComparison,
  getOptimizationRun,
  downloadOptimizationReport,
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
  mode: plannerMode = "guest",
  scenarioId: scenarioIdProp,
  initialRunId,
  forceGuest = false,
  activeTab = "comparison",
  onTabChange,
}: {
  mode?: "guest" | "org";
  scenarioId?: string;
  /** Org history replay — loads run into ComparisonView */
  initialRunId?: string | undefined;
  forceGuest?: boolean;
  activeTab?: "comparison" | "map";
  onTabChange?: (tab: "comparison" | "map") => void;
}) {
  const navigate = useNavigate();
  const isOrgMode = plannerMode === "org" && !!scenarioIdProp && !forceGuest;
  const [routeMode] = useState<Mode>("spoilage");
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [isHarvestsLoading, setIsHarvestsLoading] = useState<boolean>(true);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [scenarioId, setScenarioId] = useState<string | null>(scenarioIdProp ?? null);
  const [scenarioStatus, setScenarioStatus] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [guestMode, setGuestMode] = useState(!isOrgMode);
  const [runsRemaining, setRunsRemaining] = useState<number | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [risk, setRisk] = useState<RiskScoreResponse | null>(null);
  const [preview, setPreview] = useState<FeasibilityPreviewResponse | null>(null);
  const [scored, setScored] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [signupReason, setSignupReason] = useState<"limit" | "export">("limit");
  const [lastRunId, setLastRunId] = useState<string | null>(initialRunId ?? null);

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
        let activeScenarioId: string | null = null;

        if (isOrgMode) {
          const existing = getAccessToken();
          const meta = getAuthMeta();
          if (!existing || !meta || meta.role !== "user" || isGuestSession()) {
            throw new Error("Sesi organisasi diperlukan. Silakan masuk.");
          }
          activeScenarioId = scenarioIdProp ?? null;
          setGuestMode(false);
          setRunsRemaining(null);
        } else {
          clearAuthSession();
          const session = await createDemoSession();
          if (cancelled) return;
          activeScenarioId = session.scenario_id ?? null;
          setGuestMode(true);
          setRunsRemaining(typeof session.runs_remaining === "number" ? session.runs_remaining : 5);
        }

        if (!activeScenarioId) {
          throw new Error(
            isOrgMode ? "scenarioId tidak valid" : "Demo session did not return scenario_id",
          );
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
        if (!isOrgMode) setScenarioId(null);
        setComparisonData(EMPTY_COMPARISON);
        setIsHarvestsLoading(false);
        toast.error("Backend tidak terjangkau", { description: message });
        if (isOrgMode && /organisasi|masuk/i.test(message)) {
          void navigate({ to: "/login" });
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [forceGuest, isOrgMode, loadHarvestsFromBackend, navigate, scenarioIdProp]);

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
      const capacityOf = (id: string) => vehicles.find((v) => v.id === id)?.capacity_kg ?? 0;
      const byLargest = <T extends { vehicle_id: string }>(rows: T[]) =>
        [...rows].sort((a, b) => capacityOf(b.vehicle_id) - capacityOf(a.vehicle_id));

      // Prefer largest feasible; if none, keep current selection if rejected, else largest rejected.
      // Never toast rejected[0] alone (often the 500kg pickup) — message follows the vehicle in focus.
      let nextId: string | null = null;
      let focusRejected = null as (typeof res.rejected_vehicles)[number] | null;
      if (res.feasible_vehicles.length > 0) {
        nextId = byLargest(res.feasible_vehicles)[0]?.vehicle_id ?? null;
      } else {
        const kept = selectedVehicleId
          ? res.rejected_vehicles.find((r) => r.vehicle_id === selectedVehicleId)
          : undefined;
        focusRejected = kept ?? byLargest(res.rejected_vehicles)[0] ?? null;
        nextId = focusRejected?.vehicle_id ?? null;
      }
      setSelectedVehicleId(nextId);
      setComparisonData(EMPTY_COMPARISON);
      await refreshScenarioStatus(scenarioId);
      if (res.feasible_vehicles.length === 0) {
        const name = focusRejected?.vehicle_name ?? "Armada";
        const reason = focusRejected?.reasons[0] ?? "Semua truk ditolak.";
        toast.error("Tidak ada armada feasible", {
          description: `${name}: ${reason}`,
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
      if (raw.run_id) setLastRunId(raw.run_id);
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
        if (next === 0) {
          setSignupReason("limit");
          setSignupOpen(true);
        }
      }
      toast.success("Rute berhasil dihitung — membuka peta");
      handleTabChange("map");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("[JagaPanen] Optimasi gagal:", e);
      setComparisonData(EMPTY_COMPARISON);
      await refreshScenarioStatus(scenarioId);
      toast.error("Optimasi gagal", { description: message });
      if (guestMode && /limit|429|Sign up/i.test(message)) {
        setSignupReason("limit");
        setSignupOpen(true);
      }
      if (!guestMode && /limit|429|Upgrade|Pilot/i.test(message)) {
        toast.message("Kuota plan tercapai", {
          description: "Buka Billing untuk upgrade ke Starter atau Fleet.",
          action: {
            label: "Billing",
            onClick: () => void navigate({ to: "/app/settings/billing" }),
          },
        });
      }
    } finally {
      setIsCalculating(false);
    }
  };

  // Org history: replay a past run into ComparisonView once harvests are ready
  useEffect(() => {
    if (!isOrgMode || !initialRunId || !isBackendConnected || isHarvestsLoading) return;
    let cancelled = false;
    (async () => {
      try {
        const detail = await getOptimizationRun(initialRunId);
        if (cancelled) return;
        const mapped = mapRunDetailToComparison(detail, harvests);
        setComparisonData(mapped);
        setLastRunId(detail.id);
        setScenarioStatus("completed");
        toast.success("Run historis dimuat ke komparasi");
      } catch (e) {
        if (!cancelled) {
          toast.error("Gagal memuat run historis", {
            description: e instanceof Error ? e.message : String(e),
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- replay once per runId after harvest load
  }, [isOrgMode, initialRunId, isBackendConnected, isHarvestsLoading]);

  const handleExportClick = async () => {
    if (guestMode) {
      setSignupReason("export");
      setSignupOpen(true);
      return;
    }
    if (!lastRunId) {
      toast.error("Belum ada run untuk diekspor", {
        description: "Jalankan optimasi dulu, atau buka ulang dari Riwayat.",
      });
      return;
    }
    try {
      await downloadOptimizationReport(lastRunId, "csv");
      toast.success("Laporan keputusan CSV diunduh");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (/403/.test(message)) {
        setSignupReason("export");
        setSignupOpen(true);
        return;
      }
      toast.error("Ekspor gagal", { description: message });
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-slate-50 text-zinc-900 flex flex-col">
      {guestMode ? <GuestBanner runsRemaining={runsRemaining} /> : null}
      <ConvertToSignupModal open={signupOpen} onOpenChange={setSignupOpen} reason={signupReason} />
      <header className="w-full border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col justify-between gap-3 px-3.5 py-3 sm:flex-row sm:items-center sm:px-5">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="JagaPanen - Spoilage-Aware Agri-Logistics"
              className="h-10 w-auto flex-shrink-0 object-contain sm:h-12"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Badge
              variant="outline"
              className="rounded-full border-slate-200 bg-slate-50/50 px-2.5 py-0.5 text-[10px] font-medium text-slate-600 sm:text-[11px]"
            >
              {guestMode ? "Guest Demo" : "Org workspace"}
            </Badge>
            <Badge
              variant="outline"
              className={
                isBackendConnected
                  ? "rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700 sm:text-[11px]"
                  : "rounded-full border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium text-amber-700 sm:text-[11px]"
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
        {backendError ? (
          <div className="mx-auto w-full max-w-[1600px] break-all px-3.5 pb-3 text-[11px] leading-snug text-amber-800 sm:px-5">
            API {API_BASE_URL}: {backendError}
          </div>
        ) : null}
      </header>

      <div className="sticky top-0 z-10 w-full border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur sm:px-5 sm:py-2.5">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col justify-between gap-2.5 lg:flex-row lg:items-center">
          <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center lg:w-auto">
            <div className="flex w-full rounded-lg border border-slate-200 bg-slate-50 p-0.5 sm:w-auto">
              <button
                onClick={() => handleTabChange("comparison")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors sm:flex-none sm:px-3 ${
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
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors sm:flex-none sm:px-3 ${
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
              className="h-8 shrink-0 justify-center rounded-lg bg-emerald-600 text-xs text-white shadow-sm hover:bg-emerald-700"
            >
              <Play className="mr-1.5 h-3.5 w-3.5 shrink-0" />
              {isCalculating
                ? "Menghitung Rute..."
                : isHarvestsLoading
                  ? "Memuat Data..."
                  : "4. Jalankan Optimasi"}
            </Button>
          </div>

          <div className="flex w-full items-center gap-1.5 overflow-x-auto pb-1 lg:w-auto lg:pb-0">
            {guestMode ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => navigate({ to: "/" })}
              >
                Landing
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => navigate({ to: "/app/scenarios" })}
              >
                Skenario
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => void handleExportClick()}
            >
              <FileDown className="mr-1.5 h-3.5 w-3.5" />
              Ekspor
            </Button>
            {!guestMode ? <CommodityAdminDialog /> : null}
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

      <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-4 px-3 py-3 sm:px-5 sm:py-4">
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

        {isOverload && selectedCapacity != null ? (
          <div className="w-full rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 shadow-sm">
            <strong>
              Kapasitas armada terlampaui ({totalVolume} kg / {selectedCapacity} kg).
            </strong>{" "}
            Pilih truk lain yang feasible atau kurangi volume panen.
          </div>
        ) : null}

        {scenarioStatus === "completed" ? (
          <div className="w-full rounded-xl border border-slate-200 bg-slate-100 p-3 text-xs text-slate-700">
            Skenario <strong>completed</strong>. Gunakan <em>Reset ke Draft</em> untuk mengedit
            panen lagi, lalu ulang skor, preview, pilih truk, optimasi.
          </div>
        ) : null}

        {activeTab === "comparison" ? (
          <ComparisonView data={comparisonData} isLoading={isHarvestsLoading || isCalculating} />
        ) : null}

        {/* Map always after a successful run (and when Map tab is active) so routes are visible */}
        {activeTab === "map" ||
        (comparisonData?.baseline?.stops?.length ?? 0) > 0 ||
        (comparisonData?.jagaPanen?.stops?.length ?? 0) > 0 ? (
          <div className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
            <RouteMap
              harvests={harvests}
              mode={routeMode}
              routeGeometries={{
                baseline: comparisonData?.baseline?.geometry,
                spoilage: comparisonData?.jagaPanen?.geometry,
              }}
              baselineOrderIds={comparisonData?.baseline?.stops?.map((s) => s.harvest_id)}
              spoilageOrderIds={comparisonData?.jagaPanen?.stops?.map((s) => s.harvest_id)}
            />
          </div>
        ) : null}

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
