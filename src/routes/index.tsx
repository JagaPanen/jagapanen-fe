import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Leaf, Package, AlertTriangle, TrendingUp, ShieldCheck } from "lucide-react";
import { RouteMap } from "@/components/panenroute/RouteMap";
import { RouteCards } from "@/components/panenroute/RouteCards";
import { HarvestTable } from "@/components/panenroute/HarvestTable";
import { FormulaDialog, AddHarvestDialog } from "@/components/panenroute/Dialogs";
import { INITIAL_HARVESTS, MODES, SCENARIOS, VEHICLE, rupiah, type Harvest, type Mode } from "@/components/panenroute/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PanenRoute — Post-Harvest Decision Intelligence" },
      {
        name: "description",
        content:
          "Platform pendukung keputusan distribusi hasil panen koperasi tani: rute sadar risiko susut, bukan sekadar rute terpendek.",
      },
      { property: "og:title", content: "PanenRoute — Post-Harvest Decision Intelligence" },
      {
        property: "og:description",
        content:
          "Bandingkan rute terpendek vs rute spoilage-aware dan lihat margin koperasi yang berhasil diselamatkan.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [mode, setMode] = useState<Mode>("spoilage");
  const [harvests, setHarvests] = useState<Harvest[]>(INITIAL_HARVESTS);

  const scenario = SCENARIOS[mode];
  const totalVolume = harvests.reduce((s, h) => s + h.volume, 0);
  const utilisasi = Math.round((totalVolume / VEHICLE.kapasitas) * 100);
  const kritis = harvests.filter((h) => h.kelas === "A").length;
  const isOverload = totalVolume > VEHICLE.kapasitas;

  const handleDeleteHarvest = (id: string) => {
    setHarvests((prev) => prev.filter((h) => h.id !== id));
  };

  const handleUpdateHarvest = (updated: Harvest) => {
    setHarvests((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
  };

  // Kalkulasi reaktif untuk KPI jika jumlah baris bertambah / berkurang
  const tomatItem = harvests.find((h) => h.kelas === "A");
  const tomatVol = tomatItem ? tomatItem.volume : 0;
  const lossAvoidedDisplay = useMemo(() => {
    if (mode === "cost") return "0 kg";
    if (totalVolume === 900) return scenario.kpiLossAvoided;
    const estCostLoss = Math.round(tomatVol * 0.5 + (totalVolume - tomatVol) * 0.04);
    const estSaved = mode === "spoilage" ? Math.max(0, estCostLoss - 20) : Math.max(0, estCostLoss - 50);
    return `+${estSaved} kg`;
  }, [mode, totalVolume, tomatVol, scenario.kpiLossAvoided]);

  const marginDisplay = useMemo(() => {
    if (mode === "cost") return "Rp 0";
    if (totalVolume === 900) return scenario.kpiMargin;
    const estCostLoss = Math.round(tomatVol * 0.5 + (totalVolume - tomatVol) * 0.04);
    const estSaved = mode === "spoilage" ? Math.max(0, estCostLoss - 20) : Math.max(0, estCostLoss - 50);
    const bbmExtra = mode === "spoilage" ? 25000 : 12000;
    const net = Math.max(0, estSaved * 15000 - bbmExtra);
    return `+${rupiah(net)}`;
  }, [mode, totalVolume, tomatVol, scenario.kpiMargin]);

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-600">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold leading-tight tracking-tight">PanenRoute</h1>
              <p className="text-[11px] text-zinc-500">Post-Harvest Logistics Orchestration</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-slate-200 text-[11px] font-medium text-zinc-600">
              Pilot: Koperasi Tani Maju Bersama
            </Badge>
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[11px] text-emerald-700">
              <ShieldCheck className="mr-1 h-3 w-3" /> Data Panen Aktual
            </Badge>
          </div>
        </div>

        {/* KPI bar */}
        <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-3 px-5 pb-4 lg:grid-cols-4">
          <Kpi
            icon={<Package className="h-4 w-4" />}
            label="Total Muatan Aktif"
            value={`${totalVolume.toLocaleString("id-ID")} kg`}
            sub={
              isOverload
                ? `⚠️ Overload (${totalVolume.toLocaleString("id-ID")} kg / ${VEHICLE.kapasitas.toLocaleString("id-ID")} kg — Butuh Armada Tambahan)`
                : `Kapasitas Terisi: ${utilisasi}% dari ${VEHICLE.kapasitas.toLocaleString("id-ID")} kg`
            }
            tone={isOverload ? "rose" : undefined}
            bar={isOverload ? 100 : utilisasi}
          />
          <Kpi
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Komoditas Kritis"
            value={`${kritis} Titik`}
            sub="Tomat — Kelas A (Sangat Mudah Rusak)"
            tone="rose"
          />
          <Kpi
            icon={<TrendingUp className="h-4 w-4" />}
            label="Estimated Food Loss Avoided"
            value={lossAvoidedDisplay}
            sub={scenario.kpiLossSub}
            tone={mode === "cost" ? undefined : "emerald"}
          />
          <Kpi
            icon={<TrendingUp className="h-4 w-4" />}
            label="Net Retained Margin"
            value={marginDisplay}
            sub={scenario.kpiMarginSub}
            tone={scenario.kpiMarginTone}
          />
        </div>
      </header>

      {/* Scenario controller */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Optimization Mode
            </span>
            <div className="flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  title={m.weights}
                  className={
                    "rounded px-3 py-1.5 text-xs font-medium transition-all duration-200 " +
                    (mode === m.id
                      ? "bg-white text-zinc-900 shadow-sm ring-1 ring-slate-200"
                      : "text-zinc-500 hover:text-zinc-800")
                  }
                >
                  {m.label}
                  <span className="ml-1.5 hidden font-mono text-[10px] text-zinc-400 lg:inline">
                    {m.weights}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FormulaDialog />
            <AddHarvestDialog onAdd={(h) => setHarvests((prev) => [...prev, h])} />
          </div>
        </div>
      </div>

      {/* Workspace */}
      <main className="mx-auto max-w-[1600px] space-y-4 px-5 py-4">
        {/* Banner Peringatan Overload */}
        {isOverload && (
          <div className="flex items-center gap-3 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-rose-800 shadow-xs">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
            <div className="text-xs">
              <span className="font-bold">⚠️ Peringatan Kapasitas Armada Terlampaui:</span> Total muatan aktif sebesar{" "}
              <strong>{totalVolume.toLocaleString("id-ID")} kg</strong> melebihi batas muat Pick-up Colt L300 (
              {VEHICLE.kapasitas.toLocaleString("id-ID")} kg). Hapus salah satu baris data (misal: <code>HRV-722</code>) melalui ikon sampah di tabel agar kapasitas kembali ke batas aman, atau sediakan armada kedua.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
          <RouteMap harvests={harvests} mode={mode} />
          <RouteCards harvests={harvests} mode={mode} />
        </div>

        <HarvestTable
          harvests={harvests}
          onDelete={handleDeleteHarvest}
          onUpdate={handleUpdateHarvest}
        />

        <p className="pb-6 text-[11px] text-zinc-400">
          Perhitungan bersifat deterministik dari data panen aktual — tanpa prediksi panen, tanpa ramalan cuaca.
        </p>
      </main>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
  tone,
  bar,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone?: "rose" | "emerald" | undefined;
  bar?: number | undefined;
}) {
  return (
    <div
      className={
        "rounded-lg border bg-white p-3 transition-colors " +
        (tone === "rose"
          ? "border-rose-300 bg-rose-50/50"
          : tone === "emerald"
            ? "border-emerald-200 bg-emerald-50/50"
            : "border-slate-200")
      }
    >
      <div className="flex items-center gap-1.5 text-zinc-500">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p
        className={
          "mt-1 text-xl font-bold tracking-tight " +
          (tone === "rose" ? "text-rose-600" : tone === "emerald" ? "text-emerald-700" : "text-zinc-900")
        }
      >
        {value}
      </p>
      <p className={"text-[11px] " + (tone === "rose" ? "text-rose-700 font-medium" : "text-zinc-500")}>
        {sub}
      </p>
      {bar !== undefined && (
        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
          <div
            className={
              "h-1.5 rounded-full " +
              (tone === "rose" ? "bg-rose-500" : "bg-emerald-600")
            }
            style={{ width: `${Math.min(bar, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
