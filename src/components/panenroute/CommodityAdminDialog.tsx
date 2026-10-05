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
import { BookOpen, ExternalLink, HelpCircle, ShieldCheck, AlertCircle } from "lucide-react";
import { getCommodities, type Commodity } from "@/services/api";

const CLASS_COLORS: Record<string, string> = {
  A: "bg-rose-100 text-rose-800 border-rose-200",
  B: "bg-amber-100 text-amber-800 border-amber-200",
  C: "bg-yellow-100 text-yellow-800 border-yellow-200",
  D: "bg-emerald-100 text-emerald-800 border-emerald-200",
  E: "bg-blue-100 text-blue-800 border-blue-200",
};

export function CommodityAdminDialog() {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getCommodities();
        setCommodities(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-slate-200 text-xs text-zinc-700">
          <BookOpen className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> Database Parameter Komoditas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Katalog Parameter Kerentanan Pangan & Rujukan Ilmiah</span>
            <Badge variant="outline" className="text-[10px] text-zinc-500 font-normal">
              SOW Task 2
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Seluruh ambang batas mutu berbasis literatur ilmiah (FAO, USDA, Kementan RI) atau ditandai eksplisit sebagai{" "}
            <span className="font-semibold text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
              [ASSUMPTION]
            </span>{" "}
            untuk transparansi penuh.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
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
              {commodities.map((c) => (
                <tr key={c.id || c.name} className="hover:bg-slate-50/70">
                  <td className="p-2.5">
                    <div className="font-semibold text-zinc-900">{c.name}</div>
                    <div className="text-[10px] text-zinc-400">{c.commodity_group || "Hortikultura"}</div>
                  </td>
                  <td className="p-2.5">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                        CLASS_COLORS[c.perishability_class] || "bg-slate-100"
                      }`}
                    >
                      Kelas {c.perishability_class}
                    </span>
                  </td>
                  <td className="p-2.5">
                    <span className="font-medium text-zinc-800">{c.shelf_life_hours} jam</span>
                    {c.effective_quality_window_hours && (
                      <span className="block text-[10px] text-zinc-500">
                        Jendela Mutu: {c.effective_quality_window_hours} jam
                      </span>
                    )}
                  </td>
                  <td className="p-2.5">
                    <span className="font-semibold text-rose-700">{c.max_transit_hours || 12} jam</span>
                  </td>
                  <td className="p-2.5 text-[11px] text-zinc-600 max-w-[200px]">
                    <div>{c.special_handling || "Standar ambient"}</div>
                    {c.storage_condition && (
                      <div className="text-[10px] text-zinc-400 mt-0.5">{c.storage_condition}</div>
                    )}
                  </td>
                  <td className="p-2.5">
                    {c.is_assumption ? (
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                          <AlertCircle className="h-3 w-3" /> [ASSUMPTION]
                        </span>
                        <div className="text-[10px] text-zinc-500">{c.source_title || "Estimasi Koperasi"}</div>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
                          <ShieldCheck className="h-3 w-3" /> Validated ({c.confidence || "high"})
                        </span>
                        <div className="text-[10px] text-zinc-700 line-clamp-1" title={c.source_title}>
                          {c.source_title} {c.source_year ? `(${c.source_year})` : ""}
                        </div>
                        {c.source_url && (
                          <a
                            href={c.source_url}
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
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
