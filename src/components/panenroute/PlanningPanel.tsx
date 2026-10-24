import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, Loader2, RotateCcw, Truck } from "lucide-react";
import type {
  ConsolidationOption,
  FeasibilityPreviewResponse,
  RiskScoreResponse,
  Vehicle,
} from "@/services/api";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  ready: "Ready",
  optimizing: "Optimizing",
  completed: "Completed",
  failed: "Failed",
};

export function PlanningPanel({
  scenarioStatus,
  risk,
  preview,
  vehicles,
  selectedVehicleId,
  totalVolumeKg,
  isScoring,
  isPreviewing,
  isResetting,
  scored,
  canScore,
  canPreview,
  onScore,
  onPreview,
  onReset,
  onSelectVehicle,
}: {
  scenarioStatus: string | null;
  risk: RiskScoreResponse | null;
  preview: FeasibilityPreviewResponse | null;
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  totalVolumeKg: number;
  isScoring: boolean;
  isPreviewing: boolean;
  isResetting: boolean;
  scored: boolean;
  canScore: boolean;
  canPreview: boolean;
  onScore: () => void;
  onPreview: () => void;
  onReset: () => void;
  onSelectVehicle: (id: string) => void;
}) {
  const selected =
    vehicles.find((v) => v.id === selectedVehicleId) ??
    preview?.feasible_vehicles.find((v) => v.vehicle_id === selectedVehicleId);
  const capacityKg =
    (selected && "capacity_kg" in selected
      ? selected.capacity_kg
      : vehicles.find((v) => v.id === selectedVehicleId)?.capacity_kg) ?? null;
  const previewVehicle =
    preview?.feasible_vehicles.find((v) => v.vehicle_id === selectedVehicleId) ??
    preview?.rejected_vehicles.find((v) => v.vehicle_id === selectedVehicleId);
  const remaining =
    previewVehicle?.remaining_capacity_kg ??
    (capacityKg != null ? capacityKg - totalVolumeKg : null);

  const criticalCount =
    risk?.results.filter((r) => r.priority_level === "critical" || r.urgency_score >= 60).length ??
    0;

  const capacityOf = (vehicleId: string) =>
    vehicles.find((f) => f.id === vehicleId)?.capacity_kg ?? null;

  /** All org fleets for the picker: feasible first (largest capacity), then rejected. */
  const fleetOptions: {
    vehicle_id: string;
    vehicle_name: string;
    selectable: boolean;
    isFeasible: boolean;
    hint: string;
  }[] = (() => {
    if (preview) {
      const byCapDesc = (a: { vehicle_id: string }, b: { vehicle_id: string }) =>
        (capacityOf(b.vehicle_id) ?? 0) - (capacityOf(a.vehicle_id) ?? 0);
      const feasible = [...preview.feasible_vehicles].sort(byCapDesc).map((v) => ({
        vehicle_id: v.vehicle_id,
        vehicle_name: v.vehicle_name,
        selectable: true,
        isFeasible: true,
        hint: `Layak · sisa ${Math.round(v.remaining_capacity_kg)} kg`,
      }));
      // Rejected stay selectable so the capacity/reason text follows the chosen truck.
      const rejected = [...preview.rejected_vehicles].sort(byCapDesc).map((v) => ({
        vehicle_id: v.vehicle_id,
        vehicle_name: v.vehicle_name,
        selectable: true,
        isFeasible: false,
        hint: v.reasons[0] ?? "Ditolak",
      }));
      return [...feasible, ...rejected];
    }
    return [...vehicles]
      .sort((a, b) => b.capacity_kg - a.capacity_kg)
      .map((v) => ({
        vehicle_id: v.id,
        vehicle_name: v.name,
        selectable: true,
        isFeasible: true,
        hint: `${v.capacity_kg.toLocaleString("id-ID")} kg · preview untuk kelayakan`,
      }));
  })();

  const selectedFleetOption = fleetOptions.find((v) => v.vehicle_id === selectedVehicleId);
  const selectedRejectedReason =
    preview && selectedVehicleId
      ? preview.rejected_vehicles.find((v) => v.vehicle_id === selectedVehicleId)?.reasons[0]
      : undefined;

  return (
    <section className="w-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 px-3.5 sm:px-4 py-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-sm font-semibold text-zinc-900">Perencanaan SOW</h2>
          {scenarioStatus ? (
            <Badge
              variant="outline"
              className={
                scenarioStatus === "completed"
                  ? "border-slate-300 bg-slate-100 text-slate-700"
                  : scenarioStatus === "ready"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-800"
              }
            >
              Status: {STATUS_LABEL[scenarioStatus] ?? scenarioStatus}
            </Badge>
          ) : null}
          {scored && risk ? (
            <Badge variant="outline" className="border-slate-200 text-slate-600">
              Risiko: {risk.count} panen · {criticalCount} kritis
            </Badge>
          ) : (
            <Badge variant="outline" className="border-slate-200 text-slate-500">
              Belum di-score
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            disabled={!canScore || isScoring}
            onClick={onScore}
          >
            {isScoring ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            1. Hitung Risiko
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            disabled={!canPreview || isPreviewing}
            onClick={onPreview}
          >
            {isPreviewing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            2. Preview Kelayakan
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            disabled={!scenarioStatus || scenarioStatus === "draft" || isResetting}
            onClick={onReset}
          >
            {isResetting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            )}
            Reset ke Draft
          </Button>
        </div>
      </div>

      <div className="grid gap-3 p-3.5 sm:p-4 lg:grid-cols-3">
        <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Risiko spoilage
          </p>
          {!risk ? (
            <p className="text-xs text-zinc-500">
              Jalankan skor sebelum optimize agar urgency &amp; max transit dari API.
            </p>
          ) : (
            <ul className="space-y-1.5 max-h-40 overflow-y-auto text-xs">
              {risk.results.slice(0, 8).map((r) => (
                <li key={r.harvest_id} className="flex items-start justify-between gap-2">
                  <span className="font-medium text-zinc-800 truncate">
                    {r.label} · Kelas {r.perishability_class}
                  </span>
                  <span
                    className={
                      r.urgency_score >= 60
                        ? "text-rose-700 font-semibold shrink-0"
                        : r.urgency_score >= 30
                          ? "text-amber-700 font-semibold shrink-0"
                          : "text-emerald-700 font-semibold shrink-0"
                    }
                  >
                    {Math.round(r.urgency_score)} · {r.priority_level}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {risk ? (
            <p className="text-[10px] text-zinc-400">Formula {risk.formula_version}</p>
          ) : null}
        </div>

        <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Kelayakan armada
          </p>
          {!preview ? (
            <p className="text-xs text-zinc-500">
              Preview menampilkan truk feasible / rejected sebelum run.
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                Feasible: {preview.feasible_vehicles.length}
              </div>
              {preview.feasible_vehicles.map((v) => (
                <div
                  key={v.vehicle_id}
                  className="rounded border border-emerald-100 bg-white px-2 py-1.5"
                >
                  <p className="font-medium text-zinc-800">{v.vehicle_name}</p>
                  <p className="text-[10px] text-zinc-500">
                    Sisa kapasitas {Math.round(v.remaining_capacity_kg)} kg
                  </p>
                </div>
              ))}
              {preview.rejected_vehicles.length > 0 ? (
                <div className="flex items-start gap-1.5 text-rose-700 pt-1">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-medium">Rejected: {preview.rejected_vehicles.length}</p>
                    {preview.rejected_vehicles.map((v) => (
                      <p key={v.vehicle_id} className="text-[10px] text-rose-600/90 break-words">
                        {v.vehicle_name}: {v.reasons[0] ?? "tidak layak"}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5" /> 3. Pilih truk
          </p>
          <Select
            {...(selectedVehicleId ? { value: selectedVehicleId } : {})}
            onValueChange={onSelectVehicle}
            disabled={fleetOptions.length === 0}
          >
            <SelectTrigger className="h-8 w-full border-slate-200 text-xs bg-white">
              <SelectValue
                placeholder={
                  fleetOptions.length === 0
                    ? "Belum ada armada org"
                    : preview
                      ? "Pilih armada (layak / tersedia)"
                      : "Lihat armada tersedia"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {fleetOptions.map((v) => {
                const cap = capacityOf(v.vehicle_id);
                return (
                  <SelectItem
                    key={v.vehicle_id}
                    value={v.vehicle_id}
                    disabled={!v.selectable}
                    className="text-xs"
                  >
                    <span className="flex flex-col items-start gap-0.5 py-0.5">
                      <span>
                        {v.vehicle_name}
                        {cap != null ? ` · ${cap.toLocaleString("id-ID")} kg` : ""}
                        {preview ? (v.isFeasible ? " · layak" : " · ditolak") : ""}
                      </span>
                      <span
                        className={
                          v.isFeasible ? "text-[10px] text-zinc-500" : "text-[10px] text-rose-600"
                        }
                      >
                        {v.hint}
                      </span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {selectedRejectedReason ? (
            <p className="text-xs text-rose-700 break-words">
              {selectedFleetOption?.vehicle_name ?? "Armada"}: {selectedRejectedReason}
            </p>
          ) : preview && preview.feasible_vehicles.length === 0 ? (
            <p className="text-xs text-rose-700">
              Tidak ada armada yang muat total {totalVolumeKg.toLocaleString("id-ID")} kg. Kurangi
              volume panen atau tambah truk lebih besar di Armada.
            </p>
          ) : null}
          {capacityKg != null ? (
            <p
              className={
                totalVolumeKg > capacityKg
                  ? "text-xs text-rose-700 font-medium"
                  : "text-xs text-zinc-600"
              }
            >
              Muatan {totalVolumeKg.toLocaleString("id-ID")} kg /{" "}
              {capacityKg.toLocaleString("id-ID")} kg
              {remaining != null ? ` · sisa ~${Math.round(remaining)} kg` : ""}
              {selectedFleetOption && !selectedFleetOption.isFeasible
                ? " · tidak layak untuk run"
                : ""}
            </p>
          ) : (
            <p className="text-xs text-zinc-500">Kapasitas mengikuti armada yang dipilih (live).</p>
          )}

          {preview && preview.consolidation_options.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-semibold uppercase text-zinc-500">Konsolidasi</p>
              {preview.consolidation_options.slice(0, 3).map((opt: ConsolidationOption, i) => (
                <div
                  key={`${opt.vehicle_id ?? i}-${opt.total_volume_kg}`}
                  className={
                    opt.is_feasible
                      ? "rounded border border-emerald-100 bg-white px-2 py-1.5 text-[11px]"
                      : "rounded border border-rose-100 bg-white px-2 py-1.5 text-[11px]"
                  }
                >
                  <p className="font-medium text-zinc-800">
                    {opt.vehicle_name ?? "Armada"} · {opt.harvest_ids.length} panen ·{" "}
                    {Math.round(opt.total_volume_kg)} kg
                  </p>
                  <p className="text-zinc-500">
                    {opt.is_feasible ? "Layak digabung" : (opt.reasons[0] ?? "Tidak layak")} · ~
                    {opt.estimated_distance_km.toFixed(1)} km
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
