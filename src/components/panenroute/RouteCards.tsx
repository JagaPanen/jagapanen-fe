import { useMemo } from "react";
import { ROUTES, SCENARIOS, getRouteSequenceForMode, rupiah, type Harvest, type Mode } from "./data";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, AlertTriangle, CheckCircle2, Clock, Route as RouteIcon, Fuel } from "lucide-react";

function Sequence({ seq }: { seq: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1 text-[11px] text-zinc-600">
      {seq.map((s, i) => (
        <span key={s + i} className="flex items-center gap-1">
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-zinc-700 max-w-[220px] truncate">{s}</span>
          {i < seq.length - 1 && <ArrowRight className="h-3 w-3 text-zinc-400 shrink-0" />}
        </span>
      ))}
    </div>
  );
}

function Row({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "rose" | "emerald" | "amber";
}) {
  return (
    <div className="flex items-start justify-between gap-2 border-b border-slate-100 py-1.5 last:border-0">
      <span className="text-[11px] uppercase tracking-wide text-zinc-500 shrink-0">{label}</span>
      <span className="text-right min-w-0">
        <span
          className={
            "text-[13px] font-semibold break-words " +
            (tone === "rose"
              ? "text-rose-600"
              : tone === "emerald"
                ? "text-emerald-700"
                : tone === "amber"
                  ? "text-amber-600"
                  : "text-zinc-900")
          }
        >
          {value}
        </span>
        {sub && <span className="block text-[11px] text-zinc-500 break-words">{sub}</span>}
      </span>
    </div>
  );
}

export function RouteCards({
  harvests = [],
  mode = "spoilage",
  active,
}: {
  harvests?: Harvest[];
  mode?: Mode;
  active?: "konvensional" | "rekomendasi";
}) {
  const currentMode: Mode = mode || (active === "konvensional" ? "cost" : "spoilage");
  const scenario = SCENARIOS[currentMode];
  const k = ROUTES.konvensional;

  // Tentukan rute rekomendasi untuk kartu kedua berdasarkan mode
  const r = currentMode === "balanced" ? ROUTES.balanced : ROUTES.rekomendasi;

  const isCostActive = currentMode === "cost";
  const isBalancedActive = currentMode === "balanced";
  const isSpoilageActive = currentMode === "spoilage";

  // Urutan waypoint dinamis berdasarkan panen aktif di tabel
  const kSeq = useMemo(() => {
    if (harvests.length === 0) return k.sequence;
    const costList = getRouteSequenceForMode(harvests, "cost");
    return [
      "Pool",
      ...costList.map(
        (h) => `${h.lokasi.replace(/^Titik\s+[A-Z]\s*—\s*/i, "").trim()} (${h.komoditas})`,
      ),
      "Pasar Induk",
    ];
  }, [harvests, k.sequence]);

  const rSeq = useMemo(() => {
    if (harvests.length === 0) return r.sequence;
    const recList = getRouteSequenceForMode(
      harvests,
      currentMode === "balanced" ? "balanced" : "spoilage",
    );
    return [
      "Pool",
      ...recList.map(
        (h) => `${h.lokasi.replace(/^Titik\s+[A-Z]\s*—\s*/i, "").trim()} (${h.komoditas})`,
      ),
      "Pasar Induk",
    ];
  }, [harvests, currentMode, r.sequence]);

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2 w-full max-w-full">
      {/* Kartu 1: Rute Konvensional */}
      <div
        className={
          "rounded-lg border bg-white p-3.5 sm:p-4 transition-all duration-300 min-w-0 " +
          (isCostActive
            ? "border-rose-500 ring-2 ring-rose-200 shadow-sm"
            : "border-slate-200 opacity-80")
        }
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-900">{k.title}</h3>
          <Badge
            className={
              "self-start sm:self-auto shrink-0 font-medium " +
              (isCostActive
                ? "bg-rose-600 text-white hover:bg-rose-600"
                : "bg-rose-100 text-rose-700 hover:bg-rose-100")
            }
          >
            {isCostActive ? "Rute Terpilih (Cost Priority)" : "Tidak Direkomendasikan"}
          </Badge>
        </div>
        <div className="mt-3">
          <Sequence seq={kSeq} />
        </div>
        <div className="mt-3">
          <Row label="Jarak & Waktu" value={`${k.jarak} · ${k.waktu}`} />
          <Row label="Biaya Operasional" value={rupiah(k.biaya)} />
          <Row
            label="Spoilage Risk Score"
            value={`${k.risk}/100 — ${k.riskLabel}`}
            sub={k.riskNote}
            tone="rose"
          />
          <Row label="Estimasi Susut Panen" value={k.susut} tone="rose" />
          <Row label="Kerugian Ekonomi" value={"-" + rupiah(k.kerugian)} tone="rose" />
        </div>
        <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100">
          <div className="h-1.5 rounded-full bg-rose-500" style={{ width: `${k.risk}%` }} />
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-rose-600">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {isCostActive
            ? "Rute terpendek dengan biaya BBM minimal, namun berisiko tinggi terhadap susut panen."
            : "Rute terpendek, tetapi komoditas paling rentan diangkut terakhir."}
        </p>
      </div>

      {/* Kartu 2: Rekomendasi Terpilih (Balanced / Spoilage) */}
      <div
        className={
          "rounded-lg border bg-white p-3.5 sm:p-4 transition-all duration-300 min-w-0 " +
          (isBalancedActive
            ? "border-amber-500 ring-2 ring-amber-200 shadow-sm"
            : isSpoilageActive
              ? "border-emerald-500 ring-2 ring-emerald-200 shadow-sm"
              : "border-slate-200 opacity-75")
        }
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">{r.title}</h3>
            {isCostActive && (
              <span className="text-[10px] text-zinc-400">Alternatif Spoilage-Aware</span>
            )}
          </div>
          <Badge
            className={
              "self-start sm:self-auto shrink-0 font-medium " +
              (isBalancedActive
                ? "bg-amber-500 text-white hover:bg-amber-500"
                : isSpoilageActive
                  ? "bg-emerald-600 text-white hover:bg-emerald-600"
                  : "bg-slate-100 text-zinc-600 hover:bg-slate-100")
            }
          >
            {isCostActive ? "Deviasi Tidak Dipilih" : r.badge}
          </Badge>
        </div>
        <div className="mt-3">
          <Sequence seq={rSeq} />
        </div>
        <div className="mt-3">
          <Row label="Jarak & Waktu" value={`${r.jarak} · ${r.waktu}`} sub={r.jarakNote} />
          <Row label="Biaya Operasional" value={rupiah(r.biaya)} sub={r.biayaNote} />
          <Row
            label="Spoilage Risk Score"
            value={`${r.risk}/100 — ${r.riskLabel}`}
            sub={r.riskNote}
            tone={r.badgeVariant}
          />
          <Row label="Estimasi Susut Panen" value={r.susut} tone={r.badgeVariant} />
          <Row label={r.kerugianLabel} value={"-" + rupiah(r.kerugian)} tone={r.badgeVariant} />
        </div>
        <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100">
          <div
            className={
              "h-1.5 rounded-full " +
              (isBalancedActive ? "bg-amber-500" : isSpoilageActive ? "bg-emerald-600" : "bg-zinc-400")
            }
            style={{ width: `${r.risk}%` }}
          />
        </div>
        <p
          className={
            "mt-2 flex items-center gap-1.5 text-[11px] " +
            (isBalancedActive
              ? "text-amber-700"
              : isSpoilageActive
                ? "text-emerald-700"
                : "text-zinc-500")
          }
        >
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          {r.summaryNote}
        </p>
      </div>

      {/* Kartu Dampak: Analisis Dampak Ekonomi Bersih */}
      <div
        className={
          "xl:col-span-2 rounded-lg border p-3.5 sm:p-4 transition-all duration-300 min-w-0 " +
          (isBalancedActive
            ? "border-amber-200 bg-amber-50/50"
            : isCostActive
              ? "border-rose-200 bg-rose-50/40"
              : "border-emerald-200 bg-emerald-50/60")
        }
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <h3
            className={
              "text-xs font-bold uppercase tracking-wider " +
              (isBalancedActive
                ? "text-amber-900"
                : isCostActive
                  ? "text-rose-900"
                  : "text-emerald-800")
            }
          >
            Analisis Dampak Ekonomi Bersih — {scenario.name}
          </h3>
          <span className="text-[11px] font-mono text-zinc-500">{scenario.weights}</span>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <Impact
            icon={<RouteIcon className="h-4 w-4 shrink-0" />}
            label="Food Loss Terselamatkan"
            value={scenario.impact.foodLossAvoided}
            tone={isCostActive ? undefined : "emerald"}
          />
          <Impact
            icon={<CheckCircle2 className="h-4 w-4 shrink-0" />}
            label="Nilai Komoditas Terselamatkan"
            value={scenario.impact.nilaiTerselamatkan}
            tone={isCostActive ? undefined : "emerald"}
          />
          <Impact
            icon={<Fuel className="h-4 w-4 shrink-0" />}
            label="Tambahan Biaya Operasional"
            value={scenario.impact.tambahanBiaya}
            tone={isCostActive ? undefined : "rose"}
          />
          <Impact
            icon={<Clock className="h-4 w-4 shrink-0" />}
            label="Net Retained Value"
            value={scenario.impact.netRetainedValue}
            tone={isCostActive ? undefined : "emerald"}
          />
        </div>

        <p
          className={
            "mt-3 border-t pt-3 text-[13px] italic " +
            (isBalancedActive
              ? "border-amber-200 text-amber-950"
              : isCostActive
                ? "border-rose-200 text-rose-950"
                : "border-emerald-200 text-emerald-900")
          }
        >
          &ldquo;{scenario.impact.narasi}&rdquo;
        </p>
      </div>
    </div>
  );
}

function Impact({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "rose" | "emerald" | "amber" | undefined;
}) {
  return (
    <div className="rounded-md border border-slate-200/80 bg-white p-2.5 sm:p-3 shadow-xs min-w-0">
      <div className="flex items-center gap-1.5 text-zinc-500">
        {icon}
        <span className="text-[10px] uppercase tracking-wide truncate">{label}</span>
      </div>
      <p
        className={
          "mt-1 text-sm sm:text-base font-bold truncate " +
          (tone === "rose"
            ? "text-rose-600"
            : tone === "emerald"
              ? "text-emerald-700"
              : tone === "amber"
                ? "text-amber-600"
                : "text-zinc-900")
        }
      >
        {value}
      </p>
    </div>
  );
}
