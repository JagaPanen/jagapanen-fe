import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Pencil, Trash2 } from "lucide-react";
import { urgencyScore, type Harvest } from "./data";
import { EditHarvestDialog } from "./Dialogs";

export function HarvestTable({
  harvests,
  onDelete,
  onUpdate,
}: {
  harvests: Harvest[];
  onDelete?: (id: string) => void;
  onUpdate?: (h: Harvest) => void;
}) {
  const [q, setQ] = useState("");
  const [kelas, setKelas] = useState("all");
  const [editingHarvest, setEditingHarvest] = useState<Harvest | null>(null);

  const rows = useMemo(
    () =>
      harvests.filter(
        (h) =>
          (kelas === "all" || h.kelas === kelas) &&
          (h.komoditas + h.lokasi + h.id).toLowerCase().includes(q.toLowerCase()),
      ),
    [harvests, q, kelas],
  );

  return (
    <div className="w-full max-w-full rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 px-3.5 sm:px-4 py-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Data Panen Aktual</h2>
          <span className="sm:hidden text-[11px] text-zinc-500">{rows.length} item</span>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari komoditas / lokasi"
              className="h-8 w-full border-slate-200 pl-8 text-xs"
            />
          </div>
          <Select value={kelas} onValueChange={setKelas}>
            <SelectTrigger className="h-8 w-full sm:w-36 border-slate-200 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelas</SelectItem>
              <SelectItem value="A">Kelas A</SelectItem>
              <SelectItem value="B">Kelas B</SelectItem>
              <SelectItem value="C">Kelas C</SelectItem>
              <SelectItem value="D">Kelas D</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="w-full overflow-x-auto [scrollbar-width:thin]">
        <table className="w-full min-w-[760px] text-left text-[12px]">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-zinc-500">
            <tr>
              {[
                "Harvest ID",
                "Komoditas",
                "Lokasi",
                "Volume",
                "Jam Sejak Panen",
                "Shelf Life",
                "Kelas Kerentanan",
                "Urgency",
                "Status",
                "Aksi",
              ].map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => {
              const u = urgencyScore(h);
              const critical = u >= 60;
              const warn = u >= 30 && u < 60;
              return (
                <tr key={h.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="px-4 py-2 font-mono text-zinc-500">{h.id}</td>
                  <td className="px-4 py-2 font-medium text-zinc-900">{h.komoditas}</td>
                  <td className="px-4 py-2 text-zinc-600">{h.lokasi}</td>
                  <td className="px-4 py-2 text-zinc-900">{h.volume} kg</td>
                  <td className="px-4 py-2 text-zinc-600">{h.jamSejakPanen} jam</td>
                  <td className="px-4 py-2 text-zinc-600">{h.shelfLife} jam</td>
                  <td className="px-4 py-2">
                    <span className="text-zinc-900">Kelas {h.kelas}</span>
                    <span className="block text-[10px] text-zinc-500">{h.kelasLabel}</span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-slate-100">
                        <div
                          className={
                            "h-1.5 rounded-full " +
                            (critical ? "bg-rose-500" : warn ? "bg-amber-500" : "bg-emerald-500")
                          }
                          style={{ width: `${u}%` }}
                        />
                      </div>
                      <span className="font-semibold text-zinc-900">{u}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    {critical ? (
                      <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Kritis</Badge>
                    ) : warn ? (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Perhatian</Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Aman</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingHarvest(h)}
                        title="Edit Data Panen & Ganti Lokasi"
                        className="rounded p-1 text-zinc-500 hover:bg-slate-100 hover:text-zinc-800 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete?.(h.id)}
                        title="Hapus Baris Data Panen"
                        className="rounded p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-zinc-500">
                  Tidak ada data panen yang cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EditHarvestDialog
        harvest={editingHarvest}
        open={!!editingHarvest}
        onOpenChange={(open) => !open && setEditingHarvest(null)}
        onSave={(updated) => onUpdate?.(updated)}
      />
    </div>
  );
}
