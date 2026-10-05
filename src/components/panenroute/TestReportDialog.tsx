import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle2, ShieldAlert, Cpu, Zap, Sliders } from "lucide-react";

export function TestReportDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-slate-200 text-xs text-zinc-700">
          <Activity className="mr-1.5 h-3.5 w-3.5 text-blue-600" /> Laporan Uji QA & Solver
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>QA Benchmark & Automated Stress Test Report</span>
            <Badge variant="outline" className="text-[10px] text-zinc-500 font-normal">
              SOW Task 7
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Hasil audit komputasi, runtime solver, serta verifikasi batas ekstrem sistem (Stress Test Suite).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-xs mt-3">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold uppercase text-[10px]">
                <CheckCircle2 className="h-4 w-4" /> Automated Tests
              </div>
              <div className="text-xl font-bold text-emerald-800 mt-1">59 / 59 Lolos</div>
              <div className="text-[10px] text-emerald-600">100% Pass Rate (Pytest Suite)</div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-1.5 text-blue-800 font-semibold uppercase text-[10px]">
                <Zap className="h-4 w-4" /> Solver Runtime
              </div>
              <div className="text-xl font-bold text-blue-800 mt-1">&lt; 15 ms</div>
              <div className="text-[10px] text-blue-600">OR-Tools & Exact Permutation</div>
            </div>

            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-1.5 text-purple-800 font-semibold uppercase text-[10px]">
                <Sliders className="h-4 w-4" /> Boundary Safety
              </div>
              <div className="text-xl font-bold text-purple-800 mt-1">Zero Crash</div>
              <div className="text-[10px] text-purple-600">Deterministic Guardrails</div>
            </div>
          </div>

          {/* Test Categories Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="p-2.5 bg-slate-50 border-b border-slate-200 font-semibold text-zinc-700 flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-zinc-500" /> Matriks Verifikasi Kasus Uji Otomatis
            </div>
            <table className="w-full text-left">
              <thead className="bg-white text-[11px] text-zinc-400 uppercase border-b border-slate-100">
                <tr>
                  <th className="p-2.5">Kategori Uji</th>
                  <th className="p-2.5">Jumlah Kasus</th>
                  <th className="p-2.5">Kondisi yang Diuji</th>
                  <th className="p-2.5">Hasil Evaluasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                <tr>
                  <td className="p-2.5 font-medium text-zinc-800">Baseline Wins</td>
                  <td className="p-2.5">6 Kasus</td>
                  <td className="p-2.5 text-zinc-600">Komoditas tahan lama (Kentang, Beras, Jagung, Bawang)</td>
                  <td className="p-2.5 text-emerald-700 font-medium">✓ Lolos (Biaya Terendah)</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-zinc-800">JagaPanen Wins</td>
                  <td className="p-2.5">15 Kasus</td>
                  <td className="p-2.5 text-zinc-600">Komoditas rentan (Tomat, Stroberi, Bayam, Cabai Rawit)</td>
                  <td className="p-2.5 text-emerald-700 font-medium">✓ Lolos (Susut Terpangkas)</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-zinc-800">Infeasible / Rejection</td>
                  <td className="p-2.5">15 Kasus</td>
                  <td className="p-2.5 text-zinc-600">Overload kapasitas (+1 kg s/d +1.500 kg), radius &gt; 100 km</td>
                  <td className="p-2.5 text-emerald-700 font-medium">✓ Lolos (Ditolak Terencana)</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-zinc-800">Deterministic Formula</td>
                  <td className="p-2.5">23 Kasus</td>
                  <td className="p-2.5 text-zinc-600">Clamping nilai [0, 100], batas handling 1.0–1.6</td>
                  <td className="p-2.5 text-emerald-700 font-medium">✓ Lolos (Presisi 100%)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* System Boundaries Box */}
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2">
            <div className="font-semibold text-zinc-800 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-amber-600" /> Batasan Operasional Sistem (System Boundary Limits)
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-600">
              <div className="p-2 bg-white rounded border border-slate-100">
                <span className="font-semibold text-zinc-700">Maksimum Radius Penjemputan:</span> 100 km dari posisi awal armada.
              </div>
              <div className="p-2 bg-white rounded border border-slate-100">
                <span className="font-semibold text-zinc-700">Toleransi Kelebihan Muatan:</span> 0 kg (Strict reject pada muatan &gt; kapasitas).
              </div>
              <div className="p-2 bg-white rounded border border-slate-100">
                <span className="font-semibold text-zinc-700">Ambang Batas Pelanggaran Mutu:</span> Sisa umur simpan &le; 2 jam atau ETA &gt; M_i.
              </div>
              <div className="p-2 bg-white rounded border border-slate-100">
                <span className="font-semibold text-zinc-700">Fallback Resilience:</span> Otomatis beralih ke cache statis jika Mapbox/Backend offline.
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
