import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createScenario, getScenarios, type Scenario } from "@/services/api";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

export const Route = createFileRoute("/app/scenarios/")({
  head: () => ({ meta: [{ title: "Skenario — JagaPanen App" }] }),
  component: ScenariosPage,
});

function ScenariosPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const list = await getScenarios();
      setRows(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error("Gagal memuat skenario", {
        description: err instanceof Error ? err.message : String(err),
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const onCreate = async () => {
    setCreating(true);
    try {
      const s = await createScenario(`Skenario ${new Date().toLocaleString("id-ID")}`);
      toast.success("Skenario dibuat");
      await navigate({
        to: "/app/scenarios/$scenarioId",
        params: { scenarioId: s.id },
        search: { tab: "comparison" },
      });
    } catch (err) {
      toast.error("Gagal membuat skenario", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1100px] flex-1 space-y-4 px-3.5 py-6 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Skenario perencanaan</h1>
          <p className="text-sm text-zinc-500">
            Pilih skenario atau buat baru untuk membuka planner.
          </p>
        </div>
        <Button
          onClick={onCreate}
          disabled={creating}
          className="bg-emerald-700 hover:bg-emerald-800"
        >
          {creating ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-1.5 h-4 w-4" />
          )}
          Skenario baru
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat...
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-zinc-500">
            Belum ada skenario. Buat yang pertama untuk mulai merencana.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((s) => (
              <li key={s.id}>
                <Link
                  to="/app/scenarios/$scenarioId"
                  params={{ scenarioId: s.id }}
                  search={{ tab: "comparison" }}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{s.name}</p>
                    <p className="text-[11px] text-zinc-400 font-mono">{s.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {s.status}
                    </Badge>
                    <span className="text-xs text-zinc-500">
                      {typeof s.harvest_count === "number" ? `${s.harvest_count} panen` : "—"}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
