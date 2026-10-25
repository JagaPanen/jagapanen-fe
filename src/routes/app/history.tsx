import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  downloadOptimizationReport,
  getOptimizationRun,
  listOptimizationRuns,
  type OptimizationRunSummary,
} from "@/services/api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/history")({
  head: () => ({ meta: [{ title: "Riwayat run — Panenlink" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const navigate = useNavigate();
  const [runs, setRuns] = useState<OptimizationRunSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listOptimizationRuns();
      setRuns(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Gagal memuat riwayat", { description: msg });
      if (/403|Sign up|organization/i.test(msg)) {
        void navigate({ to: "/signup" });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const onReplay = async (run: OptimizationRunSummary) => {
    try {
      await getOptimizationRun(run.id);
      void navigate({
        to: "/app/scenarios/$scenarioId",
        params: { scenarioId: run.scenario_id },
        search: { tab: "comparison", runId: run.id },
      });
    } catch (e) {
      toast.error("Gagal membuka run", {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const onExport = async (runId: string) => {
    try {
      await downloadOptimizationReport(runId, "csv");
      toast.success("Laporan CSV diunduh");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Ekspor gagal", { description: msg });
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1100px] flex-1 space-y-4 px-3.5 py-5 sm:px-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Riwayat optimasi</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Buka ulang run ke ComparisonView atau unduh laporan keputusan (CSV).
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => void load()}>
          Muat ulang
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Memuat...</p>
      ) : runs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-zinc-500">
          Belum ada run tersimpan. Jalankan optimasi dari{" "}
          <Link to="/app/scenarios" className="font-medium text-emerald-700 underline">
            skenario
          </Link>
          .
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {runs.map((run) => (
            <li
              key={run.id}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900">
                  {run.scenario_name || "Skenario"} - {run.id.slice(0, 8)}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {run.created_at ? new Date(run.created_at).toLocaleString("id-ID") : "-"}
                  {" | net Rp "}
                  {Math.round(run.net_value_idr).toLocaleString("id-ID")}
                  {" | a="}
                  {run.alpha}
                  {" b="}
                  {run.beta}
                  {" g="}
                  {run.gamma}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => void onReplay(run)}
                >
                  Buka ulang
                </Button>
                <Button
                  size="sm"
                  className="h-8 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                  onClick={() => void onExport(run.id)}
                >
                  Unduh CSV
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
