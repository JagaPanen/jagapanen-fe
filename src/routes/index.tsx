import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Database, RefreshCw, Layers, Play } from "lucide-react";
import { RouteMap } from "@/components/panenroute/RouteMap";
import { HarvestTable } from "@/components/panenroute/HarvestTable";
import { FormulaDialog, AddHarvestDialog } from "@/components/panenroute/Dialogs";
import { ComparisonView } from "@/components/panenroute/ComparisonView";
import { CommodityAdminDialog } from "@/components/panenroute/CommodityAdminDialog";
import { TestReportDialog } from "@/components/panenroute/TestReportDialog";
import { VEHICLE, type Harvest, type Mode } from "@/components/panenroute/data";
import {
  getCommodities,
  getVehicles,
  getHarvests,
  deleteHarvest,
  backendHarvestToFrontend,
  EMPTY_COMPARISON,
  runDynamicScenario,
  calculateClientOptimization,
  type ComparisonData,
} from "@/services/api";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "JagaPanen" }],
  }),
  component: Index,
});

function Index() {
  const [mode] = useState<Mode>("spoilage");
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [isHarvestsLoading, setIsHarvestsLoading] = useState<boolean>(true);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [activeTab, setActiveTab] = useState<"comparison" | "map">("comparison");
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  const loadHarvestsFromBackend = async () => {
    setIsHarvestsLoading(true);
    try {
      const [backendItems, catalog] = await Promise.all([getHarvests(), getCommodities()]);
      if (backendItems && backendItems.length > 0) {
        const mapped = backendItems.map((bh) => backendHarvestToFrontend(bh, catalog));
        setHarvests(mapped);

        // Sinkronisasi kalkulasi rute awal saat data backend selesai dimuat
        const initialCalculated = calculateClientOptimization({
          destination: { lat: VEHICLE.marketCoord[0], lng: VEHICLE.marketCoord[1], name: VEHICLE.tujuan },
          vehicles: [
            {
              name: VEHICLE.nama,
              location: { lat: VEHICLE.poolCoord[0], lng: VEHICLE.poolCoord[1], name: VEHICLE.pool },
              capacity_kg: VEHICLE.kapasitas,
              cost_per_km_idr: 5000,
            },
          ],
          harvests: mapped,
        });
        setComparisonData(initialCalculated);
        return mapped;
      } else {
        setHarvests([]);
        setComparisonData(EMPTY_COMPARISON);
      }
    } catch (err) {
      console.warn("Gagal memuat panen dari backend:", err);
      setComparisonData(EMPTY_COMPARISON);
    } finally {
      setIsHarvestsLoading(false);
    }
    return null;
  };

  useEffect(() => {
    async function checkBackend() {
      try {
        const [comms, vehs] = await Promise.all([getCommodities(), getVehicles()]);
        if (comms.length > 0 && vehs.length > 0) {
          setIsBackendConnected(true);
          await loadHarvestsFromBackend();
        } else {
          setIsBackendConnected(false);
          setIsHarvestsLoading(false);
        }
      } catch {
        setIsBackendConnected(false);
        setIsHarvestsLoading(false);
      }
    }
    checkBackend();
  }, []);

  const totalVolume = harvests.reduce((s, h) => s + h.volume, 0);
  const isOverload = !isHarvestsLoading && totalVolume > VEHICLE.kapasitas;

  const handleRunOptimization = async () => {
    setIsCalculating(true);
    try {
      if (harvests.length > 0) {
        const payload = {
          scenario_name: "Live Planning Run",
          destination: {
            lat: VEHICLE.marketCoord[0],
            lng: VEHICLE.marketCoord[1],
            name: VEHICLE.tujuan,
          },
          harvests: harvests.map((h) => ({
            id: h.id,
            label: `${h.komoditas} (${h.lokasi})`,
            commodity: h.komoditas,
            commodity_name: h.komoditas,
            perishability_class: h.kelas,
            shelf_life_hours: h.shelfLife,
            hours_since_harvest: h.jamSejakPanen,
            price_per_kg: h.nilaiPerKg,
            quantity_kg: h.volume,
            location: { lat: h.lat, lng: h.lng, name: h.lokasi },
            harvest_timestamp: new Date(Date.now() - h.jamSejakPanen * 3600 * 1000).toISOString(),
            initial_condition: "fresh",
            handling_factor:
              h.kelas === "A" ? 1.6 : h.kelas === "B" ? 1.3 : h.kelas === "C" ? 1.1 : h.kelas === "D" ? 1.0 : 0.9,
          })),
          vehicles: [
            {
              id: "v-l300",
              name: VEHICLE.nama,
              location: { lat: VEHICLE.poolCoord[0], lng: VEHICLE.poolCoord[1], name: VEHICLE.pool },
              capacity_kg: VEHICLE.kapasitas,
              available: true,
              cost_per_km_idr: 5000,
            },
          ],
          mode: "spoilage_priority",
        };

        const res = await runDynamicScenario(payload);
        if (res && res.baseline && res.jagaPanen) {
          setComparisonData(res);
        }
      }
    } catch (e) {
      console.warn("Optimasi kalkulasi rute:", e);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-slate-50 text-zinc-900 flex flex-col">
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
            <Badge variant="outline" className="border-slate-200 rounded-full px-2.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-slate-600 bg-slate-50/50">
              Pilot: Koperasi Tani Maju Bersama
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
                  <ShieldCheck className="mr-1 h-3 w-3 shrink-0" /> Backend Active (Neon DB)
                </>
              ) : (
                <>
                  <Database className="mr-1 h-3 w-3 shrink-0" /> Standalone Demo (Safety Fallback)
                </>
              )}
            </Badge>
          </div>
        </div>
      </header>

      {/* Mode & Switcher Bar */}
      <div className="sticky top-0 z-10 w-full border-b border-slate-200 bg-white/95 backdrop-blur px-3 sm:px-5 py-2 sm:py-2.5">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab("comparison")}
                className={`flex-1 sm:flex-none justify-center rounded-md px-2.5 sm:px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === "comparison" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <Layers className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Komparasi Skenario (Demo Utama)</span>
                <span className="sm:hidden">Komparasi</span>
              </button>
              <button
                onClick={() => setActiveTab("map")}
                className={`flex-1 sm:flex-none justify-center rounded-md px-2.5 sm:px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === "map" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Peta Penjemputan</span>
                <span className="sm:hidden">Peta Armada</span>
              </button>
            </div>

            <Button
              size="sm"
              onClick={handleRunOptimization}
              disabled={isCalculating || isHarvestsLoading || isOverload || harvests.length === 0}
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
            <CommodityAdminDialog />
            <TestReportDialog />
            <FormulaDialog />
            <AddHarvestDialog
              onAdd={(h) => setHarvests((p) => [...p, h])}
              onAddSuccess={async () => {
                await loadHarvestsFromBackend();
              }}
            />
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-4 px-3 sm:px-5 py-3 sm:py-4">
        {isOverload && (
          <div className="w-full p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl shadow-sm">
            ⚠️ <strong>Kapasitas Armada Terlampaui ({totalVolume} kg / {VEHICLE.kapasitas} kg).</strong> Hapus salah satu
            baris panen di tabel agar kapasitas kembali aman.
          </div>
        )}

        {/* Tampilan Komparasi SOW Task 3, 4, 5 */}
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
          onDelete={async (id) => {
            const updated = harvests.filter((x) => x.id !== id);
            setHarvests(updated);
            if (updated.length > 0) {
              const recalculated = calculateClientOptimization({
                destination: { lat: VEHICLE.marketCoord[0], lng: VEHICLE.marketCoord[1], name: VEHICLE.tujuan },
                vehicles: [
                  {
                    name: VEHICLE.nama,
                    location: { lat: VEHICLE.poolCoord[0], lng: VEHICLE.poolCoord[1], name: VEHICLE.pool },
                    capacity_kg: VEHICLE.kapasitas,
                    cost_per_km_idr: 5000,
                  },
                ],
                harvests: updated,
              });
              setComparisonData(recalculated);
            } else {
              setComparisonData(EMPTY_COMPARISON);
            }
            if (id.includes("-") && id.length > 10) {
              try {
                await deleteHarvest(id);
                toast.success("Data panen berhasil dihapus dari database");
              } catch (err) {
                console.warn("Gagal menghapus panen backend:", err);
              }
            }
          }}
          onUpdate={(u) => {
            const updated = harvests.map((x) => (x.id === u.id ? u : x));
            setHarvests(updated);
            const recalculated = calculateClientOptimization({
              destination: { lat: VEHICLE.marketCoord[0], lng: VEHICLE.marketCoord[1], name: VEHICLE.tujuan },
              vehicles: [
                {
                  name: VEHICLE.nama,
                  location: { lat: VEHICLE.poolCoord[0], lng: VEHICLE.poolCoord[1], name: VEHICLE.pool },
                  capacity_kg: VEHICLE.kapasitas,
                  cost_per_km_idr: 5000,
                },
              ],
              harvests: updated,
            });
            setComparisonData(recalculated);
          }}
        />
      </main>
    </div>
  );
}