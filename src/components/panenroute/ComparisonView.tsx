import {
  CheckCircle2,
  AlertOctagon,
  TrendingUp,
  DollarSign,
  Clock,
  Navigation,
} from "lucide-react";
import { type ComparisonData } from "@/services/api";

function formatRp(val: number) {
  return "Rp " + (val || 0).toLocaleString("id-ID");
}

export function ComparisonView({
  data,
  isLoading = false,
}: {
  data: ComparisonData | null;
  isLoading?: boolean;
}) {
  const showSkeleton = isLoading || !data;
  const baseline = data?.baseline;
  const jagaPanen = data?.jagaPanen;
  const hasStops = (jagaPanen?.stops?.length ?? 0) > 0;

  return (
    <div className="space-y-4 w-full max-w-full">
      {/* Task 5: Impact Calculator Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm min-w-0">
          <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <TrendingUp className="h-4 w-4 shrink-0 text-emerald-600" />{" "}
            <span className="truncate">Food Loss Avoided</span>
          </div>
          {showSkeleton ? (
            <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-8 rounded w-3/4 my-1.5" />
          ) : (
            <div className="text-lg sm:text-xl font-bold text-emerald-700 mt-1 truncate">
              +{jagaPanen?.food_loss_avoided_kg ?? 0} kg
            </div>
          )}
          <div className="text-[10px] text-emerald-600 truncate">Estimasi muatan terselamatkan</div>
        </div>

        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm min-w-0">
          <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <DollarSign className="h-4 w-4 shrink-0 text-emerald-600" />{" "}
            <span className="truncate">Economic Loss Avoided</span>
          </div>
          {showSkeleton ? (
            <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-8 rounded w-3/4 my-1.5" />
          ) : (
            <div
              className="text-lg sm:text-xl font-bold text-emerald-700 mt-1 truncate"
              title={formatRp(jagaPanen?.economic_loss_avoided_idr ?? 0)}
            >
              {formatRp(jagaPanen?.economic_loss_avoided_idr ?? 0)}
            </div>
          )}
          <div className="text-[10px] text-emerald-600 truncate">Nilai komoditas aman</div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm min-w-0">
          <div className="flex items-center gap-1.5 text-slate-600 text-xs font-bold uppercase tracking-wider">
            <Navigation className="h-4 w-4 shrink-0 text-slate-500" />{" "}
            <span className="truncate">Biaya BBM Tambahan</span>
          </div>
          {showSkeleton ? (
            <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-8 rounded w-3/4 my-1.5" />
          ) : (
            <div
              className="text-lg sm:text-xl font-bold text-slate-800 mt-1 truncate"
              title={formatRp(jagaPanen?.additional_logistics_cost_idr ?? 0)}
            >
              +{formatRp(jagaPanen?.additional_logistics_cost_idr ?? 0)}
            </div>
          )}
          <div className="text-[10px] text-slate-500 truncate">Konsekuensi rute detour</div>
        </div>

        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl shadow-sm min-w-0">
          <div className="flex items-center gap-1.5 text-blue-800 text-xs font-bold uppercase tracking-wider">
            <TrendingUp className="h-4 w-4 shrink-0 text-blue-600" />{" "}
            <span className="truncate">Net Retained Margin</span>
          </div>
          {showSkeleton ? (
            <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-8 rounded w-3/4 my-1.5" />
          ) : (
            <div
              className="text-lg sm:text-xl font-bold text-blue-700 mt-1 truncate"
              title={formatRp(jagaPanen?.net_retained_margin_idr ?? 0)}
            >
              +{formatRp(jagaPanen?.net_retained_margin_idr ?? 0)}
            </div>
          )}
          <div className="text-[10px] text-blue-600 truncate">Margin bersih koperasi</div>
        </div>
      </div>

      {/* Task 3: Side-by-Side Main Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
        {/* Kolom Kiri: Baseline */}
        <div className="border border-slate-200 bg-white rounded-xl p-3.5 sm:p-4 shadow-sm min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-zinc-800">Rute Konvensional (Baseline)</h3>
              <p className="text-[11px] text-zinc-500">Objektif: Jarak Tempuh Terpendek</p>
            </div>
            {showSkeleton ? (
              <span className="animate-pulse bg-slate-200 h-5 w-16 rounded-full shrink-0" />
            ) : (baseline?.quality_violations_count ?? 0) > 0 ? (
              <span className="self-start sm:self-auto flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                <AlertOctagon className="h-3 w-3 shrink-0" /> {baseline?.quality_violations_count}{" "}
                Pelanggaran Mutu
              </span>
            ) : (
              <span className="self-start sm:self-auto flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-zinc-700 shrink-0">
                Aman
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 py-2.5 sm:py-3 my-2 bg-slate-50 rounded-md text-center text-xs">
            <div className="min-w-0 px-1">
              <span className="text-[10px] text-zinc-400 block truncate">Jarak</span>
              {showSkeleton ? (
                <div className="animate-pulse bg-slate-200 h-4 w-12 mx-auto rounded my-0.5" />
              ) : (
                <span className="font-semibold text-xs sm:text-sm text-zinc-900 truncate block">
                  {baseline?.total_distance_km ?? 0} km
                </span>
              )}
            </div>
            <div className="min-w-0 px-1">
              <span className="text-[10px] text-zinc-400 block truncate">Durasi</span>
              {showSkeleton ? (
                <div className="animate-pulse bg-slate-200 h-4 w-12 mx-auto rounded my-0.5" />
              ) : (
                <span className="font-semibold text-xs sm:text-sm text-zinc-900 truncate block">
                  {baseline?.total_duration_minutes ?? 0} mnt
                </span>
              )}
            </div>
            <div className="min-w-0 px-1">
              <span className="text-[10px] text-zinc-400 block truncate">Biaya Logistik</span>
              {showSkeleton ? (
                <div className="animate-pulse bg-slate-200 h-4 w-16 mx-auto rounded my-0.5" />
              ) : (
                <span
                  className="font-semibold text-xs sm:text-sm text-zinc-900 truncate block"
                  title={formatRp(baseline?.logistics_cost_idr ?? 0)}
                >
                  {formatRp(baseline?.logistics_cost_idr ?? 0)}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2 mt-3">
            <div className="text-[11px] font-semibold text-zinc-500 uppercase">
              Urutan Penjemputan:
            </div>
            {showSkeleton ? (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 sm:p-2.5 rounded border border-slate-200 bg-slate-50/50 animate-pulse"
                >
                  <span className="w-5 h-5 rounded-full bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                    <div className="h-2.5 bg-slate-200 rounded w-1/2" />
                  </div>
                  <div className="h-3.5 bg-slate-200 rounded w-14 shrink-0" />
                </div>
              ))
            ) : !hasStops ? (
              <div className="p-4 text-center text-xs text-zinc-500 bg-slate-50 rounded border border-dashed border-slate-200">
                Belum ada data panen untuk dioptimalkan.
              </div>
            ) : (
              baseline?.stops.map((stop) => (
                <div
                  key={stop.stop_order}
                  className={`flex items-center justify-between gap-2 p-2 sm:p-2.5 rounded border text-xs ${
                    stop.violation ? "bg-rose-50 border-rose-200" : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-zinc-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {stop.stop_order}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-zinc-800 truncate block">{stop.label}</span>
                      <span className="text-[10px] text-zinc-400 truncate block">
                        {stop.commodity_name} ({stop.volume_kg} kg)
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-zinc-500 block whitespace-nowrap">
                      ETA: {stop.eta_minutes} mnt
                    </span>
                    {stop.violation && (
                      <span className="text-[10px] font-bold text-rose-600 block whitespace-nowrap">
                        Kritis Rusak!
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kolom Kanan: JagaPanen */}
        <div className="border border-emerald-300 bg-white rounded-xl p-3.5 sm:p-4 shadow-sm ring-1 ring-emerald-500/10 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-100">
            <div>
              <h3 className="text-sm font-bold text-emerald-950">
                Rute JagaPanen (Spoilage-Aware)
              </h3>
              <p className="text-[11px] text-emerald-700">
                Objektif: Biaya + Detour + Proteksi Mutu
              </p>
            </div>
            {showSkeleton ? (
              <span className="animate-pulse bg-emerald-100 h-5 w-24 rounded-full shrink-0" />
            ) : (
              <span className="self-start sm:self-auto flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                <CheckCircle2 className="h-3 w-3 shrink-0" /> Mutu Terlindungi
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 py-2.5 sm:py-3 my-2 bg-emerald-50/50 rounded-md text-center text-xs">
            <div className="min-w-0 px-1">
              <span className="text-[10px] text-emerald-700 block truncate">Jarak</span>
              {showSkeleton ? (
                <div className="animate-pulse bg-emerald-100 h-4 w-12 mx-auto rounded my-0.5" />
              ) : (
                <span className="font-semibold text-xs sm:text-sm text-emerald-950 truncate block">
                  {jagaPanen?.total_distance_km ?? 0} km
                </span>
              )}
            </div>
            <div className="min-w-0 px-1">
              <span className="text-[10px] text-emerald-700 block truncate">Durasi</span>
              {showSkeleton ? (
                <div className="animate-pulse bg-emerald-100 h-4 w-12 mx-auto rounded my-0.5" />
              ) : (
                <span className="font-semibold text-xs sm:text-sm text-emerald-950 truncate block">
                  {jagaPanen?.total_duration_minutes ?? 0} mnt
                </span>
              )}
            </div>
            <div className="min-w-0 px-1">
              <span className="text-[10px] text-emerald-700 block truncate">Biaya Logistik</span>
              {showSkeleton ? (
                <div className="animate-pulse bg-emerald-100 h-4 w-16 mx-auto rounded my-0.5" />
              ) : (
                <span
                  className="font-semibold text-xs sm:text-sm text-emerald-950 truncate block"
                  title={formatRp(jagaPanen?.logistics_cost_idr ?? 0)}
                >
                  {formatRp(jagaPanen?.logistics_cost_idr ?? 0)}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2 mt-3">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase">
              Urutan Penjemputan Cerdas:
            </div>
            {showSkeleton ? (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 sm:p-2.5 rounded border border-emerald-100 bg-emerald-50/30 animate-pulse"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-200 shrink-0" />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="h-3.5 bg-emerald-100 rounded w-3/4" />
                    <div className="h-2.5 bg-emerald-100/70 rounded w-1/2" />
                  </div>
                  <div className="h-3.5 bg-emerald-100 rounded w-16 shrink-0" />
                </div>
              ))
            ) : !hasStops ? (
              <div className="p-4 text-center text-xs text-emerald-700 bg-emerald-50/40 rounded border border-dashed border-emerald-200">
                Belum ada data panen untuk dioptimalkan.
              </div>
            ) : (
              jagaPanen?.stops.map((stop) => (
                <div
                  key={stop.stop_order}
                  className="flex items-center justify-between gap-2 p-2 sm:p-2.5 rounded border border-emerald-200 bg-emerald-50/30 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                      {stop.stop_order}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-emerald-950 truncate block">
                        {stop.label}
                      </span>
                      <span className="text-[10px] text-emerald-700 truncate block">
                        {stop.commodity_name} ({stop.volume_kg} kg)
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-emerald-700 block whitespace-nowrap">
                      ETA: {stop.eta_minutes} mnt
                    </span>
                    <span className="text-[10px] text-emerald-600 block whitespace-nowrap">
                      Sisa Mutu: {stop.projected_quality_hours_left} jam
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Task 4: Explainability UI */}
          <div className="mt-4 p-3 bg-zinc-50 border border-zinc-200 rounded-md">
            <div className="text-[11px] font-bold text-zinc-700 uppercase mb-1.5 flex items-center gap-1">
              <Clock className="h-3 w-3 text-zinc-500 shrink-0" /> Mengapa Rute Ini Terpilih?
              (Algoritma Explainability)
            </div>
            {showSkeleton ? (
              <div className="space-y-2 pt-1 animate-pulse">
                <div className="h-3 bg-zinc-200 rounded w-full" />
                <div className="h-3 bg-zinc-200 rounded w-5/6" />
                <div className="h-3 bg-zinc-200 rounded w-4/6" />
              </div>
            ) : (jagaPanen?.explainability_reasons?.length ?? 0) === 0 ? (
              <p className="text-[11px] text-zinc-500">
                Belum ada data panen untuk dianalisis oleh algoritma explainability.
              </p>
            ) : (
              <ul className="text-[11px] text-zinc-600 space-y-1 list-disc pl-4 break-words">
                {jagaPanen?.explainability_reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
