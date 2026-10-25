import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createCommodity,
  getCommoditiesAdmin,
  updateCommodity,
  type Commodity,
} from "@/services/api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/catalog")({
  head: () => ({ meta: [{ title: "Katalog — Panenlink App" }] }),
  component: CatalogPage,
});

const CLASSES = ["A", "B", "C", "D", "E"] as const;

function CatalogPage() {
  const [rows, setRows] = useState<Commodity[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [kelas, setKelas] = useState<(typeof CLASSES)[number]>("A");
  const [shelf, setShelf] = useState("48");
  const [price, setPrice] = useState("15000");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await getCommoditiesAdmin(false));
    } catch (e) {
      toast.error("Gagal memuat katalog", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onCreate = async () => {
    if (!name.trim()) {
      toast.error("Nama komoditas wajib diisi");
      return;
    }
    setBusy(true);
    try {
      await createCommodity({
        name: name.trim(),
        perishability_class: kelas,
        shelf_life_hours: Number(shelf) || 48,
        default_price_idr_per_kg: Number(price) || 15000,
      });
      toast.success("Komoditas ditambahkan");
      setName("");
      await load();
    } catch (e) {
      toast.error("Gagal menambah komoditas", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (c: Commodity) => {
    const active = c.active !== false;
    try {
      await updateCommodity(c.id, { active: !active });
      await load();
    } catch (e) {
      toast.error("Gagal mengubah status", {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1100px] flex-1 space-y-4 px-3.5 py-6 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Katalog komoditas</h1>
          <p className="text-sm text-zinc-500">
            Editor kelas perishability A–E per organisasi. Digunakan saat input panen dan skor
            risiko.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="h-8 text-xs">
          <Link to="/app/scenarios">Ke skenario</Link>
        </Button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-800">Tambah komoditas</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5 lg:col-span-2">
            <Label className="text-xs">Nama</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tomat cherry"
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Kelas</Label>
            <Select value={kelas} onValueChange={(v) => setKelas(v as (typeof CLASSES)[number])}>
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLASSES.map((k) => (
                  <SelectItem key={k} value={k} className="text-xs">
                    Kelas {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Shelf life (jam)</Label>
            <Input
              type="number"
              value={shelf}
              onChange={(e) => setShelf(e.target.value)}
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Harga (Rp/kg)</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>
        <Button
          onClick={() => void onCreate()}
          disabled={busy}
          className="mt-3 h-9 bg-emerald-700 text-xs hover:bg-emerald-800"
        >
          {" "}
          ( ) ( )
          {busy ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="mr-1 h-3.5 w-3.5" />
          )}
          Tambah ke katalog
        </Button>
      </section>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat katalog…
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-zinc-500">Katalog kosong.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Nama</th>
                <th className="px-4 py-2.5 font-medium">Kelas</th>
                <th className="px-4 py-2.5 font-medium">Shelf life</th>
                <th className="px-4 py-2.5 font-medium">Rp/kg</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((c) => {
                const active = c.active !== false;
                return (
                  <tr key={c.id} className="text-zinc-800">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">{c.perishability_class}</td>
                    <td className="px-4 py-3">{c.shelf_life_hours} jam</td>
                    <td className="px-4 py-3">
                      {c.default_price_idr_per_kg.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          active
                            ? "rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-800"
                            : "rounded bg-slate-100 px-1.5 py-0.5 text-xs text-zinc-500"
                        }
                      >
                        {active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => void toggleActive(c)}
                      >
                        {active ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
