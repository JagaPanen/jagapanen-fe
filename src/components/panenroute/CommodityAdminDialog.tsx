import { useEffect, useState } from "react";
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
import { BookOpen, ExternalLink, ShieldCheck, AlertCircle } from "lucide-react";
import { getCommodities, type Commodity } from "@/services/api";

const CLASS_COLORS: Record<string, string> = {
  A: "bg-rose-100 text-rose-800 border-rose-200",
  B: "bg-amber-100 text-amber-800 border-amber-200",
  C: "bg-yellow-100 text-yellow-800 border-yellow-200",
  D: "bg-emerald-100 text-emerald-800 border-emerald-200",
  E: "bg-blue-100 text-blue-800 border-blue-200",
};

function CommodityRow({ commodity }: { commodity: Commodity }) {
  const perishabilityClass = commodity.perishability_class || "-";
  const classColor = CLASS_COLORS[perishabilityClass] || "bg-slate-100";

  return (
    <tr className="hover:bg-slate-50/70">
      <td className="p-2.5">
        <div className="font-semibold text-zinc-900">{commodity.name || "Tanpa nama"}</div>
        <div className="text-[10px] text-zinc-400">
          {commodity.commodity_group || "Hortikultura"}
        </div>
      </td>
      <td className="p-2.5">
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${classColor}`}
        >
          Kelas {perishabilityClass}
        </span>
      </td>
      <td className="p-2.5">
        <span className="font-medium text-zinc-800">{commodity.shelf_life_hours ?? 0} jam</span>
        {commodity.effective_quality_window_hours != null && (
          <span className="block text-[10px] text-zinc-500">
            Jendela Mutu: {commodity.effective_quality_window_hours} jam
          </span>
        )}
      </td>
      <td className="p-2.5">
        <span className="font-semibold text-rose-700">{commodity.max_transit_hours || 12} jam</span>
      </td>
      <td className="p-2.5 text-[11px] text-zinc-600 max-w-[200px]">
        <div>{commodity.special_handling || "Standar ambient"}</div>
        {commodity.storage_condition && (
          <div className="text-[10px] text-zinc-400 mt-0.5">{commodity.storage_condition}</div>
        )}
      </td>
      <td className="p-2.5">
        {commodity.is_assumption ? (
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
              <AlertCircle className="h-3 w-3" /> [ASSUMPTION]
            </span>
            <div className="text-[10px] text-zinc-500">
              {commodity.source_title || "Estimasi Koperasi"}
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
              <ShieldCheck className="h-3 w-3" /> Validated ({commodity.confidence || "high"})
            </span>
            <div className="text-[10px] text-zinc-700 line-clamp-1" title={commodity.source_title}>
              {commodity.source_title || "Sumber tidak tercatat"}{" "}
              {commodity.source_year ? `(${commodity.source_year})` : ""}
            </div>
            {commodity.source_url && (
              <a
                href={commodity.source_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 hover:underline"
              >
                Tautan Dokumen <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

export function CommodityAdminDialog() {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getCommodities();
        if (!cancelled) setCommodities(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          setCommodities([]);
          setError(err instanceof Error ? err.message : "Gagal memuat katalog komoditas");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-slate-200 text-xs text-zinc-700 whitespace-nowrap shrink-0"
        >
          <BookOpen className="mr-1.5 h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span className="hidden sm:inline">Database Parameter Komoditas</span>
          <span className="sm:hidden">Parameter Komoditas</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-full max-w-4xl max-h-[85vh] p-4 sm:p-6 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <span>Katalog Parameter Kerentanan Pangan & Rujukan Ilmiah</span>
            <Badge variant="outline" className="text-[10px] text-zinc-500 font-normal">
              SOW Task 2
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Seluruh ambang batas mutu berbasis literatur ilmiah (FAO, USDA, Kementan RI) atau
            ditandai eksplisit sebagai{" "}
            <span className="font-semibold text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
              [ASSUMPTION]
            </span>{" "}
            untuk transparansi penuh.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="mt-3 w-full overflow-x-auto border border-slate-200 rounded-lg [scrollbar-width:thin]">
          <table className="w-full min-w-[650px] text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-zinc-500 border-b border-slate-200">
              <tr>
                <th className="p-2.5">Komoditas & Grup</th>
                <th className="p-2.5">Kelas</th>
                <th className="p-2.5">Masa Simpan (L_i)</th>
                <th className="p-2.5">Batas Transit (M_i)</th>
                <th className="p-2.5">Penanganan Khusus</th>
                <th className="p-2.5">Sumber Ilmiah & Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-zinc-500">
                    Memuat katalog...
                  </td>
                </tr>
              ) : commodities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-zinc-500">
                    Katalog komoditas kosong.
                  </td>
                </tr>
              ) : (
                commodities.map((commodity) => (
                  <CommodityRow key={commodity.id || commodity.name} commodity={commodity} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
