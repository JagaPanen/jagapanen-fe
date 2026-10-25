import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createVehicle, getVehicles, updateVehicle, type Vehicle } from "@/services/api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/fleet")({
  head: () => ({ meta: [{ title: "Armada — Panenlink App" }] }),
  component: FleetPage,
});

function FleetPage() {
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("1000");
  const [costPerKm, setCostPerKm] = useState("5000");
  const [lat, setLat] = useState("-7.502");
  const [lng, setLng] = useState("110.2185");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await getVehicles(false));
    } catch (e) {
      toast.error("Gagal memuat armada", {
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
      toast.error("Nama kendaraan wajib diisi");
      return;
    }
    setBusy(true);
    try {
      await createVehicle({
        name: name.trim(),
        capacity_kg: Number(capacity) || 1000,
        cost_per_km_idr: Number(costPerKm) || 5000,
        current_location_lat: Number(lat) || -7.502,
        current_location_lng: Number(lng) || 110.2185,
        available_from: new Date().toISOString(),
        available_until: null,
      });
      toast.success("Kendaraan ditambahkan");
      setName("");
      await load();
    } catch (e) {
      toast.error("Gagal menambah armada", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (v: Vehicle) => {
    try {
      await updateVehicle(v.id, { active: !v.active });
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
          <h1 className="text-xl font-semibold text-zinc-900">Armada</h1>
          <p className="text-sm text-zinc-500">
            Kelola kendaraan org. Armada aktif muncul di planner saat optimasi.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="h-8 text-xs">
          <Link to="/app/scenarios">Ke skenario</Link>
        </Button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-800">Tambah kendaraan</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label className="text-xs">Nama</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Box Truck 1200kg"
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Kapasitas (kg)</Label>
            <Input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Biaya / km (Rp)</Label>
            <Input
              type="number"
              value={costPerKm}
              onChange={(e) => setCostPerKm(e.target.value)}
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Posisi lat</Label>
            <Input value={lat} onChange={(e) => setLat(e.target.value)} className="text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Posisi lng</Label>
            <Input value={lng} onChange={(e) => setLng(e.target.value)} className="text-xs" />
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => void onCreate()}
              disabled={busy}
              className="h-9 w-full bg-emerald-700 text-xs hover:bg-emerald-800"
            >
              {busy ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="mr-1 h-3.5 w-3.5" />
              )}
              Tambah
            </Button>
          </div>
        </div>
      </section>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat armada…
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-zinc-500">Belum ada kendaraan.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Nama</th>
                <th className="px-4 py-2.5 font-medium">Kapasitas</th>
                <th className="px-4 py-2.5 font-medium">Rp/km</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((v) => (
                <tr key={v.id} className="text-zinc-800">
                  <td className="px-4 py-3 font-medium">{v.name}</td>
                  <td className="px-4 py-3">{v.capacity_kg.toLocaleString("id-ID")} kg</td>
                  <td className="px-4 py-3">{v.cost_per_km_idr.toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        v.active
                          ? "rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-800"
                          : "rounded bg-slate-100 px-1.5 py-0.5 text-xs text-zinc-500"
                      }
                    >
                      {v.active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => void toggleActive(v)}
                    >
                      {v.active ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
