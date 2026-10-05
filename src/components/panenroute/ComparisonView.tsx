import { CheckCircle2, AlertOctagon, TrendingUp, DollarSign, Clock, Navigation } from "lucide-react";
import { type ComparisonData } from "@/services/api";

function formatRp(val: number) {
  return "Rp " + val.toLocaleString("id-ID");
}

export function ComparisonView({ data }: { data: ComparisonData }) {
  const { baseline, jagaPanen } = data;

  return (
    <div className="space-y-4">
      {/* Task 5: Impact Calculator Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center gap-1.5 text-emerald-800 text-[11px] font-semibold uppercase">
            <TrendingUp className="h-4 w-4" /> Food Loss Avoided
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1">+{jagaPanen.food_loss_avoided_kg} kg</div>
          <div className="text-[10px] text-emerald-600">Estimasi muatan terselamatkan</div>
        </div>

        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center gap-1.5 text-emerald-800 text-[11px] font-semibold uppercase">
            <DollarSign className="h-4 w-4" /> Economic Loss Avoided
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{formatRp(jagaPanen.economic_loss_avoided_idr)}</div>
          <div className="text-[10px] text-emerald-600">Nilai komoditas aman</div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center gap-1.5 text-zinc-600 text-[11px] font-semibold uppercase">
            <Navigation className="h-4 w-4" /> Biaya BBM Tambahan
          </div>
          <div className="text-xl font-bold text-zinc-800 mt-1">+{formatRp(jagaPanen.additional_logistics_cost_idr)}</div>
          <div className="text-[10px] text-zinc-500">Konsekuensi rute detour</div>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-1.5 text-blue-800 text-[11px] font-semibold uppercase">
            <TrendingUp className="h-4 w-4" /> Net Retained Margin
          </div>
          <div className="text-xl font-bold text-blue-700 mt-1">+{formatRp(jagaPanen.net_retained_margin_idr)}</div>
          <div className="text-[10px] text-blue-600">Margin bersih koperasi</div>
        </div>
      </div>

      {/* Task 3: Side-by-Side Main Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Kolom Kiri: Baseline */}
        <div className="border border-slate-200 bg-white rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-zinc-800">Rute Konvensional (Baseline)</h3>
              <p className="text-[11px] text-zinc-500">Objektif: Jarak Tempuh Terpendek</p>
            </div>
            {baseline.quality_violations_count > 0 ? (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                <AlertOctagon className="h-3 w-3" /> {baseline.quality_violations_count} Pelanggaran Mutu
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-zinc-700">
                Aman
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 py-3 my-2 bg-slate-50 rounded-md text-center text-xs">
            <div>
              <span className="text-[10px] text-zinc-400 block">Jarak</span>
              <span className="font-semibold">{baseline.total_distance_km} km</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block">Durasi</span>
              <span className="font-semibold">{baseline.total_duration_minutes} mnt</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block">Biaya Logistik</span>
              <span className="font-semibold">{formatRp(baseline.logistics_cost_idr)}</span>
            </div>
          </div>

          <div className="space-y-2 mt-3">
            <div className="text-[11px] font-semibold text-zinc-500 uppercase">Urutan Penjemputan:</div>
            {baseline.stops.map((stop) => (
              <div key={stop.stop_order} className={`flex items-center justify-between p-2 rounded border text-xs ${stop.violation ? "bg-rose-50 border-rose-200" : "bg-white border-slate-200"}`}>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-zinc-700 flex items-center justify-center font-bold text-[10px]">
                    {stop.stop_order}
                  </span>
                  <div>
                    <span className="font-medium text-zinc-800">{stop.label}</span>
                    <span className="text-[10px] text-zinc-400 block">{stop.commodity_name} ({stop.volume_kg} kg)</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 block">ETA: {stop.eta_minutes} mnt</span>
                  {stop.violation && <span className="text-[10px] font-bold text-rose-600">Kritis Rusak!</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kolom Kanan: JagaPanen */}
        <div className="border border-emerald-300 bg-white rounded-lg p-4 shadow-xs ring-1 ring-emerald-500/10">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <div>
              <h3 className="text-sm font-bold text-emerald-950">Rute JagaPanen (Spoilage-Aware)</h3>
              <p className="text-[11px] text-emerald-700">Objektif: Biaya + Detour + Proteksi Mutu</p>
            </div>
            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-3 w-3" /> Mutu Terlindungi
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 py-3 my-2 bg-emerald-50/50 rounded-md text-center text-xs">
            <div>
              <span className="text-[10px] text-emerald-700 block">Jarak</span>
              <span className="font-semibold text-emerald-950">{jagaPanen.total_distance_km} km</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-700 block">Durasi</span>
              <span className="font-semibold text-emerald-950">{jagaPanen.total_duration_minutes} mnt</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-700 block">Biaya Logistik</span>
              <span className="font-semibold text-emerald-950">{formatRp(jagaPanen.logistics_cost_idr)}</span>
            </div>
          </div>

          <div className="space-y-2 mt-3">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase">Urutan Penjemputan Cerdas:</div>
            {jagaPanen.stops.map((stop) => (
              <div key={stop.stop_order} className="flex items-center justify-between p-2 rounded border border-emerald-200 bg-emerald-50/30 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                    {stop.stop_order}
                  </span>
                  <div>
                    <span className="font-medium text-emerald-950">{stop.label}</span>
                    <span className="text-[10px] text-emerald-700 block">{stop.commodity_name} ({stop.volume_kg} kg)</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-700 block">ETA: {stop.eta_minutes} mnt</span>
                  <span className="text-[10px] text-emerald-600">Sisa Mutu: {stop.projected_quality_hours_left} jam</span>
                </div>
              </div>
            ))}
          </div>

          {/* Task 4: Explainability UI */}
          <div className="mt-4 p-3 bg-zinc-50 border border-zinc-200 rounded-md">
            <div className="text-[11px] font-bold text-zinc-700 uppercase mb-1.5 flex items-center gap-1">
              <Clock className="h-3 w-3 text-zinc-500" /> Mengapa Rute Ini Terpilih? (Algoritma Explainability)
            </div>
            <ul className="text-[11px] text-zinc-600 space-y-1 list-disc pl-4">
              {jagaPanen.explainability_reasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
