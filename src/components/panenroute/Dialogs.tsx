import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Info, Plus, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  createHarvest,
  getCommodities,
  isUuidLike,
  updateHarvest,
  type Commodity,
  type HarvestCreatePayload,
} from "@/services/api";
import { LOCATION_COORDINATES, LOCATION_PRESETS, DEFAULT_COORDINATE, type Harvest } from "./data";

export function FormulaDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-slate-200 text-xs text-zinc-700 whitespace-nowrap shrink-0"
        >
          <Info className="mr-1.5 h-3.5 w-3.5 text-zinc-500 shrink-0" />
          <span className="hidden sm:inline">Transparansi Formula</span>
          <span className="sm:hidden">Formula</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-full max-w-2xl max-h-[85vh] p-4 sm:p-6 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transparansi Formula Perhitungan</DialogTitle>
          <DialogDescription className="text-xs">
            Seluruh keputusan bersifat deterministik — tanpa prediksi, tanpa machine learning.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-xs sm:text-sm">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Spoilage Risk Score
            </p>
            <code className="mt-1.5 block font-mono text-[11px] sm:text-[13px] text-zinc-900 break-words overflow-x-auto">
              Spoilage Risk = min(100, ((t_harvest + t_transit) / ShelfLife) × 100 × k_handling)
            </code>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Objective Function
            </p>
            <code className="mt-1.5 block font-mono text-[11px] sm:text-[13px] text-zinc-900 break-words overflow-x-auto">
              Total Cost = α(Travel Cost) + β(Detour Cost) + γ(Spoilage Risk)
            </code>
          </div>

          <div className="space-y-2">
            {[
              ["t_harvest", "Jam aktual sejak komoditas dipanen (data nyata, bukan prediksi)."],
              [
                "t_transit",
                "Estimasi jam tempuh dari titik panen sampai pasar pada urutan rute tersebut.",
              ],
              ["ShelfLife", "Masa simpan komoditas dalam jam (Tomat 48, Cabai 96, Kentang 720)."],
              ["k_handling", "Faktor kelas kerentanan: A=1.6, B=1.3, C=1.1, D=1.0."],
              ["α (alpha)", "Bobot biaya perjalanan (BBM, jarak tempuh, operasional kendaraan)."],
              ["β (beta)", "Bobot biaya deviasi rute dari jalur terpendek."],
              [
                "γ (gamma)",
                "Bobot risiko susut panen — semakin tinggi, semakin diprioritaskan komoditas rentan.",
              ],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 border-b border-slate-100 pb-2 last:border-0"
              >
                <span className="w-28 shrink-0 font-mono text-[11px] sm:text-[12px] font-semibold text-emerald-700">
                  {k}
                </span>
                <span className="text-xs sm:text-[13px] text-zinc-600 break-words">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const CLASS_LABELS: Record<Harvest["kelas"], string> = {
  A: "Sangat Mudah Rusak",
  B: "Mudah Rusak",
  C: "Cukup Tahan",
  D: "Tahan Lama",
  E: "Pangan Pokok (Tahan Lama)",
};

const DESTINATION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Pasar Induk Caringin": { lat: -6.92, lng: 107.61 },
  "Pasar Induk Giwangan": { lat: -7.834, lng: 110.3912 },
  "Gudang Sentra Koperasi": { lat: -7.502, lng: 110.2185 },
};

function applyCommodityFields(
  commodity: Commodity,
  setters: {
    setCommodityId: (v: string) => void;
    setKomoditas: (v: string) => void;
    setKelas: (v: Harvest["kelas"]) => void;
    setShelfLife: (v: string) => void;
    setNilaiPerKg: (v: string) => void;
  },
) {
  setters.setCommodityId(commodity.id);
  setters.setKomoditas(commodity.name);
  setters.setKelas(commodity.perishability_class);
  setters.setShelfLife(String(commodity.shelf_life_hours));
  setters.setNilaiPerKg(String(commodity.default_price_idr_per_kg));
}

export function AddHarvestDialog({
  onAdd,
  onAddSuccess,
  scenarioId,
  isBackendConnected = false,
}: {
  onAdd?: (h: Harvest) => void;
  onAddSuccess?: () => Promise<void> | void;
  scenarioId?: string | null;
  isBackendConnected?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [catalog, setCatalog] = useState<Commodity[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [commodityId, setCommodityId] = useState("");
  const [komoditas, setKomoditas] = useState("");
  const [presetLocation, setPresetLocation] = useState(
    LOCATION_PRESETS[0] || "Titik A — Desa Sawangan",
  );
  const [customLocationName, setCustomLocationName] = useState("");
  const [lat, setLat] = useState<number>(
    LOCATION_COORDINATES[LOCATION_PRESETS[0] || ""]?.[0] || DEFAULT_COORDINATE[0],
  );
  const [lng, setLng] = useState<number>(
    LOCATION_COORDINATES[LOCATION_PRESETS[0] || ""]?.[1] || DEFAULT_COORDINATE[1],
  );
  const [volume, setVolume] = useState("300");
  const [jamSejakPanen, setJamSejakPanen] = useState("6");
  const [shelfLife, setShelfLife] = useState("48");
  const [kelas, setKelas] = useState<Harvest["kelas"]>("A");
  const [nilaiPerKg, setNilaiPerKg] = useState("15000");
  const [initialCondition, setInitialCondition] = useState("fresh");
  const [destination, setDestination] = useState("Pasar Induk Caringin");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await getCommodities();
        if (cancelled) return;
        setCatalog(rows);
        setCatalogError(rows.length === 0 ? "Katalog komoditas kosong." : null);
        const first = rows[0];
        if (first) {
          applyCommodityFields(first, {
            setCommodityId,
            setKomoditas,
            setKelas,
            setShelfLife,
            setNilaiPerKg,
          });
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setCatalog([]);
        setCatalogError(message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleCommoditySelect = (id: string) => {
    const selected = catalog.find((c) => c.id === id);
    if (!selected) return;
    applyCommodityFields(selected, {
      setCommodityId,
      setKomoditas,
      setKelas,
      setShelfLife,
      setNilaiPerKg,
    });
  };

  const handleLocationChange = (val: string) => {
    setPresetLocation(val);
    if (val !== "custom") {
      const coords = LOCATION_COORDINATES[val];
      if (coords) {
        setLat(coords[0]);
        setLng(coords[1]);
      }
    }
  };

  const submit = async () => {
    if (!komoditas || !volume || !commodityId) return;
    setIsSubmitting(true);
    const finalLocation =
      presetLocation === "custom" ? customLocationName || "Lokasi Kustom" : presetLocation;
    const hours = Number(jamSejakPanen) || 0;
    const shelf = Number(shelfLife) || 48;
    const factor =
      initialCondition === "critical" ? 1.6 : initialCondition === "slightly_bruised" ? 1.3 : 1.0;
    const destCoord = DESTINATION_COORDINATES[destination] || { lat: -6.92, lng: 107.61 };

    const payload: HarvestCreatePayload = {
      commodity_id: commodityId,
      label: `${komoditas} (${finalLocation})`,
      location_lat: Number(lat) || DEFAULT_COORDINATE[0],
      location_lng: Number(lng) || DEFAULT_COORDINATE[1],
      volume_kg: Number(volume),
      harvested_at: new Date(Date.now() - hours * 3600 * 1000).toISOString(),
      destination_lat: destCoord.lat,
      destination_lng: destCoord.lng,
      destination_name: destination,
      handling_factor: factor,
    };

    const localHarvest: Harvest = {
      id: "HRV-" + String(Math.floor(Math.random() * 900) + 100),
      komoditas,
      lokasi: finalLocation,
      volume: Number(volume),
      jamSejakPanen: hours,
      shelfLife: shelf,
      kelas,
      kelasLabel: CLASS_LABELS[kelas] || `Kelas ${kelas}`,
      nilaiPerKg: Number(nilaiPerKg) || 15000,
      lat: Number(lat) || DEFAULT_COORDINATE[0],
      lng: Number(lng) || DEFAULT_COORDINATE[1],
      urgency: Math.min(100, Math.round((hours / shelf) * 100)),
    };

    if (isBackendConnected) {
      if (!scenarioId) {
        toast.error("Gagal menyimpan panen", {
          description: "Skenario belum siap. Muat ulang halaman setelah backend aktif.",
        });
        setIsSubmitting(false);
        return;
      }
      try {
        await createHarvest(payload, scenarioId);
        toast.success(`Data panen ${komoditas} (${volume} kg) berhasil disimpan ke database!`);
        await onAddSuccess?.();
        setOpen(false);
        setVolume("300");
        setJamSejakPanen("6");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Gagal menyimpan panen ke backend:", err);
        toast.error("Gagal menyimpan panen", { description: message });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    toast.info(`Mode lokal: Panen ${komoditas} (${volume} kg) ditambahkan ke antarmuka.`);
    onAdd?.(localHarvest);
    setOpen(false);
    setVolume("300");
    setJamSejakPanen("6");
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-8 bg-emerald-600 text-white hover:bg-emerald-700 whitespace-nowrap shrink-0"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Tambah Data Panen</span>
          <span className="sm:hidden">Tambah Panen</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-full max-w-lg max-h-[90vh] p-4 sm:p-6 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Data Panen Aktual</DialogTitle>
          <DialogDescription className="text-xs">
            Hanya hasil panen yang sudah siap kirim. Titik lokasi akan langsung disinkronkan ke
            peta.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-600">Pilihan Komoditas</Label>
            <Select
              value={commodityId}
              onValueChange={handleCommoditySelect}
              disabled={catalog.length === 0}
            >
              <SelectTrigger className="border-slate-200 text-xs">
                <SelectValue placeholder={catalogError || "Memuat katalog..."} />
              </SelectTrigger>
              <SelectContent>
                {catalog.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {c.name} (Kelas {c.perishability_class})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {catalogError && <p className="text-[10px] text-amber-700">{catalogError}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-600">Kondisi Awal Panen</Label>
            <Select value={initialCondition} onValueChange={setInitialCondition}>
              <SelectTrigger className="border-slate-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fresh" className="text-xs">
                  Segar Prima (Faktor 1.0)
                </SelectItem>
                <SelectItem value="slightly_bruised" className="text-xs">
                  Memar Ringan (Faktor 1.3)
                </SelectItem>
                <SelectItem value="critical" className="text-xs">
                  Kritis / Sangat Matang (Faktor 1.6)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-1 sm:col-span-2 space-y-1.5">
            <Label className="text-xs text-zinc-600">Lokasi Titik Panen (Penjemputan)</Label>
            <Select value={presetLocation} onValueChange={handleLocationChange}>
              <SelectTrigger className="border-slate-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_PRESETS.map((loc) => (
                  <SelectItem key={loc} value={loc} className="text-xs">
                    {loc}
                  </SelectItem>
                ))}
                <SelectItem value="custom" className="text-xs font-semibold text-emerald-700">
                  + Lokasi Kustom (Input Koordinat)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {presetLocation === "custom" ? (
            <>
              <div className="col-span-1 sm:col-span-2">
                <Field
                  label="Nama Lokasi Kustom"
                  value={customLocationName}
                  onChange={setCustomLocationName}
                  placeholder="Nama sentra / desa pertanian"
                />
              </div>
              <Field
                label="Latitude"
                value={String(lat)}
                onChange={(v) => setLat(Number(v) || 0)}
                type="number"
                placeholder="-7.5020"
              />
              <Field
                label="Longitude"
                value={String(lng)}
                onChange={(v) => setLng(Number(v) || 0)}
                type="number"
                placeholder="110.2185"
              />
            </>
          ) : (
            <div className="col-span-1 sm:col-span-2 rounded border border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] text-zinc-600 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">
                Koordinat Terpetakan:{" "}
                <code className="font-mono font-semibold">
                  {lat}, {lng}
                </code>
              </span>
            </div>
          )}

          <Field
            label="Volume Muatan (kg)"
            type="number"
            value={volume}
            onChange={setVolume}
            placeholder="Misal: 300"
          />
          <Field
            label="Waktu Petik (Jam Sejak Panen)"
            type="number"
            value={jamSejakPanen}
            onChange={setJamSejakPanen}
            placeholder="Misal: 6"
          />
          <Field
            label="Masa Simpan L_i (jam)"
            type="number"
            value={shelfLife}
            onChange={setShelfLife}
            placeholder="Misal: 48"
          />
          <Field
            label="Estimasi Nilai (Rp/kg)"
            type="number"
            value={nilaiPerKg}
            onChange={setNilaiPerKg}
            placeholder="Misal: 15000"
          />

          <div className="col-span-1 sm:col-span-2 space-y-1.5">
            <Label className="text-xs text-zinc-600">Tujuan Distribusi (Pasar / Gudang)</Label>
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger className="border-slate-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pasar Induk Caringin" className="text-xs">
                  Pasar Induk Caringin (Bandung)
                </SelectItem>
                <SelectItem value="Pasar Induk Giwangan" className="text-xs">
                  Pasar Induk Giwangan (Yogyakarta)
                </SelectItem>
                <SelectItem value="Gudang Sentra Koperasi" className="text-xs">
                  Gudang Sentra Koperasi Tani
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={submit}
            disabled={isSubmitting}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {isSubmitting ? "Menyimpan ke Database..." : "Simpan Data Panen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditHarvestDialog({
  harvest,
  open,
  onOpenChange,
  onSave,
  onSaveSuccess,
  isBackendConnected = false,
}: {
  harvest: Harvest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (h: Harvest) => void;
  onSaveSuccess?: () => Promise<void> | void;
  isBackendConnected?: boolean;
}) {
  const [komoditas, setKomoditas] = useState("");
  const [presetLocation, setPresetLocation] = useState("");
  const [customLocationName, setCustomLocationName] = useState("");
  const [lat, setLat] = useState<number>(DEFAULT_COORDINATE[0]);
  const [lng, setLng] = useState<number>(DEFAULT_COORDINATE[1]);
  const [volume, setVolume] = useState("");
  const [jamSejakPanen, setJamSejakPanen] = useState("");
  const [shelfLife, setShelfLife] = useState("48");
  const [kelas, setKelas] = useState<Harvest["kelas"]>("A");
  const [nilaiPerKg, setNilaiPerKg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (harvest) {
      setKomoditas(harvest.komoditas);
      setVolume(String(harvest.volume));
      setJamSejakPanen(String(harvest.jamSejakPanen));
      setShelfLife(String(harvest.shelfLife));
      setKelas(harvest.kelas);
      setNilaiPerKg(String(harvest.nilaiPerKg));
      setLat(harvest.lat);
      setLng(harvest.lng);

      if (LOCATION_PRESETS.includes(harvest.lokasi)) {
        setPresetLocation(harvest.lokasi);
        setCustomLocationName("");
      } else {
        setPresetLocation("custom");
        setCustomLocationName(harvest.lokasi);
      }
    }
  }, [harvest]);

  const handleLocationChange = (val: string) => {
    setPresetLocation(val);
    if (val !== "custom") {
      const coords = LOCATION_COORDINATES[val];
      if (coords) {
        setLat(coords[0]);
        setLng(coords[1]);
      }
    }
  };

  const submit = async () => {
    if (!harvest || !komoditas || !volume) return;
    const finalLocation =
      presetLocation === "custom" ? customLocationName || "Lokasi Kustom" : presetLocation;
    const hours = Number(jamSejakPanen) || 0;
    const shelf = Number(shelfLife) || 48;
    const updated: Harvest = {
      ...harvest,
      komoditas,
      lokasi: finalLocation,
      volume: Number(volume),
      jamSejakPanen: hours,
      shelfLife: shelf,
      kelas,
      kelasLabel: CLASS_LABELS[kelas],
      nilaiPerKg: Number(nilaiPerKg) || 0,
      lat: Number(lat) || DEFAULT_COORDINATE[0],
      lng: Number(lng) || DEFAULT_COORDINATE[1],
      urgency: Math.min(100, Math.round((hours / shelf) * 100)),
    };

    if (isBackendConnected && isUuidLike(harvest.id)) {
      setIsSubmitting(true);
      try {
        await updateHarvest(harvest.id, {
          label: `${komoditas} (${finalLocation})`,
          location_lat: updated.lat,
          location_lng: updated.lng,
          volume_kg: updated.volume,
          harvested_at: new Date(Date.now() - hours * 3600 * 1000).toISOString(),
        });
        toast.success("Perubahan panen berhasil disimpan");
        await onSaveSuccess?.();
        onOpenChange(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Gagal memperbarui panen:", err);
        toast.error("Gagal memperbarui panen", { description: message });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    onSave(updated);
    onOpenChange(false);
  };

  if (!harvest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-full max-w-lg max-h-[90vh] p-4 sm:p-6 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Data Panen ({harvest.id})</DialogTitle>
          <DialogDescription className="text-xs">
            Perbarui data komoditas atau ganti lokasi titik jemput panen. Peta akan otomatis
            menyesuaikan rute.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Komoditas" value={komoditas} onChange={setKomoditas} />

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-600">Lokasi Titik Panen</Label>
            <Select value={presetLocation} onValueChange={handleLocationChange}>
              <SelectTrigger className="border-slate-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_PRESETS.map((loc) => (
                  <SelectItem key={loc} value={loc} className="text-xs">
                    {loc}
                  </SelectItem>
                ))}
                <SelectItem value="custom" className="text-xs font-semibold text-emerald-700">
                  + Lokasi Kustom (Input Koordinat)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {presetLocation === "custom" ? (
            <>
              <div className="col-span-1 sm:col-span-2">
                <Field
                  label="Nama Lokasi Kustom"
                  value={customLocationName}
                  onChange={setCustomLocationName}
                />
              </div>
              <Field
                label="Latitude"
                value={String(lat)}
                onChange={(v) => setLat(Number(v) || 0)}
                type="number"
              />
              <Field
                label="Longitude"
                value={String(lng)}
                onChange={(v) => setLng(Number(v) || 0)}
                type="number"
              />
            </>
          ) : (
            <div className="col-span-1 sm:col-span-2 rounded border border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] text-zinc-600 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">
                Koordinat Terpetakan:{" "}
                <code className="font-mono font-semibold">
                  {lat}, {lng}
                </code>
              </span>
            </div>
          )}

          <Field label="Volume (kg)" type="number" value={volume} onChange={setVolume} />
          <Field
            label="Jam Sejak Panen"
            type="number"
            value={jamSejakPanen}
            onChange={setJamSejakPanen}
          />
          <Field label="Shelf Life (jam)" type="number" value={shelfLife} onChange={setShelfLife} />
          <Field label="Nilai (Rp/kg)" type="number" value={nilaiPerKg} onChange={setNilaiPerKg} />

          <div className="col-span-1 sm:col-span-2 space-y-1.5">
            <Label className="text-xs text-zinc-600">Kelas Kerentanan</Label>
            <Select value={kelas} onValueChange={(v) => setKelas(v as Harvest["kelas"])}>
              <SelectTrigger className="border-slate-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CLASS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-xs">
                    Kelas {k} — {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={submit}
            disabled={isSubmitting}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-zinc-600">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-slate-200 text-xs"
      />
    </div>
  );
}
