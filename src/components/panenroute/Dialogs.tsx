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
import {
  LOCATION_COORDINATES,
  LOCATION_PRESETS,
  DEFAULT_COORDINATE,
  urgencyScore,
  type Harvest,
} from "./data";

export function FormulaDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-slate-200 text-zinc-700">
          <Info className="mr-1.5 h-4 w-4" /> Transparansi Formula
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transparansi Formula Perhitungan</DialogTitle>
          <DialogDescription>
            Seluruh keputusan bersifat deterministik — tanpa prediksi, tanpa machine learning.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Spoilage Risk Score
            </p>
            <code className="mt-1.5 block font-mono text-[13px] text-zinc-900">
              Spoilage Risk = min(100, ((t_harvest + t_transit) / ShelfLife) × 100 × k_handling)
            </code>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Objective Function
            </p>
            <code className="mt-1.5 block font-mono text-[13px] text-zinc-900">
              Total Cost = α(Travel Cost) + β(Detour Cost) + γ(Spoilage Risk)
            </code>
          </div>

          <div className="space-y-2">
            {[
              ["t_harvest", "Jam aktual sejak komoditas dipanen (data nyata, bukan prediksi)."],
              ["t_transit", "Estimasi jam tempuh dari titik panen sampai pasar pada urutan rute tersebut."],
              ["ShelfLife", "Masa simpan komoditas dalam jam (Tomat 48, Cabai 96, Kentang 720)."],
              ["k_handling", "Faktor kelas kerentanan: A=1.6, B=1.3, C=1.1, D=1.0."],
              ["α (alpha)", "Bobot biaya perjalanan (BBM, jarak tempuh, operasional kendaraan)."],
              ["β (beta)", "Bobot biaya deviasi rute dari jalur terpendek."],
              ["γ (gamma)", "Bobot risiko susut panen — semakin tinggi, semakin diprioritaskan komoditas rentan."],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3 border-b border-slate-100 pb-2 last:border-0">
                <span className="w-28 shrink-0 font-mono text-[12px] font-semibold text-emerald-700">
                  {k}
                </span>
                <span className="text-[13px] text-zinc-600">{v}</span>
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
};

const COMMODITY_PRESETS = [
  { name: "Tomat", kelas: "A", shelf: 48, price: 15000 },
  { name: "Bayam (Sayur Daun)", kelas: "A", shelf: 24, price: 12000 },
  { name: "Stroberi", kelas: "A", shelf: 36, price: 60000 },
  { name: "Cabai Rawit Merah", kelas: "B", shelf: 96, price: 45000 },
  { name: "Paprika", kelas: "B", shelf: 120, price: 35000 },
  { name: "Kubis", kelas: "C", shelf: 240, price: 8000 },
  { name: "Pisang Ambon", kelas: "C", shelf: 168, price: 14000 },
  { name: "Kentang Granola", kelas: "D", shelf: 720, price: 14000 },
  { name: "Bawang Merah", kelas: "D", shelf: 480, price: 32000 },
  { name: "Beras Medium", kelas: "E", shelf: 4320, price: 13500 },
];

export function AddHarvestDialog({ onAdd }: { onAdd: (h: Harvest) => void }) {
  const [open, setOpen] = useState(false);
  const [komoditas, setKomoditas] = useState(COMMODITY_PRESETS[0].name);
  const [presetLocation, setPresetLocation] = useState(LOCATION_PRESETS[0] || "Titik A — Desa Sawangan");
  const [customLocationName, setCustomLocationName] = useState("");
  const [lat, setLat] = useState<number>(LOCATION_COORDINATES[LOCATION_PRESETS[0] || ""]?.[0] || DEFAULT_COORDINATE[0]);
  const [lng, setLng] = useState<number>(LOCATION_COORDINATES[LOCATION_PRESETS[0] || ""]?.[1] || DEFAULT_COORDINATE[1]);
  const [volume, setVolume] = useState("300");
  const [jamSejakPanen, setJamSejakPanen] = useState("6");
  const [shelfLife, setShelfLife] = useState(String(COMMODITY_PRESETS[0].shelf));
  const [kelas, setKelas] = useState<Harvest["kelas"]>(COMMODITY_PRESETS[0].kelas as Harvest["kelas"]);
  const [nilaiPerKg, setNilaiPerKg] = useState(String(COMMODITY_PRESETS[0].price));
  const [initialCondition, setInitialCondition] = useState("fresh");
  const [destination, setDestination] = useState("Pasar Induk Caringin");

  const handleCommoditySelect = (val: string) => {
    setKomoditas(val);
    const p = COMMODITY_PRESETS.find((c) => c.name === val);
    if (p) {
      setKelas(p.kelas as Harvest["kelas"]);
      setShelfLife(String(p.shelf));
      setNilaiPerKg(String(p.price));
    }
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

  const submit = () => {
    if (!komoditas || !volume) return;
    const finalLocation = presetLocation === "custom" ? customLocationName || "Lokasi Kustom" : presetLocation;
    const hours = Number(jamSejakPanen) || 0;
    const shelf = Number(shelfLife) || 48;
    const newHarvest: Harvest = {
      id: "HRV-" + String(Math.floor(Math.random() * 900) + 100),
      komoditas,
      lokasi: finalLocation,
      volume: Number(volume),
      jamSejakPanen: hours,
      shelfLife: shelf,
      kelas,
      kelasLabel: CLASS_LABELS[kelas] || `Kelas ${kelas}`,
      nilaiPerKg: Number(nilaiPerKg) || 0,
      lat: Number(lat) || DEFAULT_COORDINATE[0],
      lng: Number(lng) || DEFAULT_COORDINATE[1],
      urgency: Math.min(100, Math.round((hours / shelf) * 100)),
    };
    onAdd(newHarvest);
    setOpen(false);
    // Reset form
    setVolume("300");
    setJamSejakPanen("6");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700">
          <Plus className="mr-1.5 h-4 w-4" /> Tambah Data Panen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Data Panen Aktual</DialogTitle>
          <DialogDescription>
            Hanya hasil panen yang sudah siap kirim. Titik lokasi akan langsung disinkronkan ke peta.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-600">Pilihan Komoditas</Label>
            <Select value={komoditas} onValueChange={handleCommoditySelect}>
              <SelectTrigger className="border-slate-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMODITY_PRESETS.map((c) => (
                  <SelectItem key={c.name} value={c.name} className="text-xs">
                    {c.name} (Kelas {c.kelas})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-600">Kondisi Awal Panen</Label>
            <Select value={initialCondition} onValueChange={setInitialCondition}>
              <SelectTrigger className="border-slate-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fresh" className="text-xs">Segar Prima (Faktor 1.0)</SelectItem>
                <SelectItem value="slightly_bruised" className="text-xs">Memar Ringan (Faktor 1.3)</SelectItem>
                <SelectItem value="critical" className="text-xs">Kritis / Sangat Matang (Faktor 1.6)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-1.5">
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
              <div className="col-span-2">
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
            <div className="col-span-2 rounded border border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] text-zinc-600 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>
                Koordinat Terpetakan: <code className="font-mono font-semibold">{lat}, {lng}</code>
              </span>
            </div>
          )}

          <Field label="Volume Muatan (kg)" type="number" value={volume} onChange={setVolume} placeholder="Misal: 300" />
          <Field label="Waktu Petik (Jam Sejak Panen)" type="number" value={jamSejakPanen} onChange={setJamSejakPanen} placeholder="Misal: 6" />
          <Field label="Masa Simpan L_i (jam)" type="number" value={shelfLife} onChange={setShelfLife} placeholder="Misal: 48" />
          <Field label="Estimasi Nilai (Rp/kg)" type="number" value={nilaiPerKg} onChange={setNilaiPerKg} placeholder="Misal: 15000" />

          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs text-zinc-600">Tujuan Distribusi (Pasar / Gudang)</Label>
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger className="border-slate-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pasar Induk Caringin" className="text-xs">Pasar Induk Caringin (Bandung)</SelectItem>
                <SelectItem value="Pasar Induk Giwangan" className="text-xs">Pasar Induk Giwangan (Yogyakarta)</SelectItem>
                <SelectItem value="Gudang Sentra Koperasi" className="text-xs">Gudang Sentra Koperasi Tani</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} className="bg-emerald-600 text-white hover:bg-emerald-700">
            Simpan Data Panen
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
}: {
  harvest: Harvest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (h: Harvest) => void;
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

  const submit = () => {
    if (!harvest || !komoditas || !volume) return;
    const finalLocation = presetLocation === "custom" ? customLocationName || "Lokasi Kustom" : presetLocation;
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
    onSave(updated);
    onOpenChange(false);
  };

  if (!harvest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Data Panen ({harvest.id})</DialogTitle>
          <DialogDescription>
            Perbarui data komoditas atau ganti lokasi titik jemput panen. Peta akan otomatis menyesuaikan rute.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
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
              <div className="col-span-2">
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
            <div className="col-span-2 rounded border border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] text-zinc-600 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>
                Koordinat Terpetakan: <code className="font-mono font-semibold">{lat}, {lng}</code>
              </span>
            </div>
          )}

          <Field label="Volume (kg)" type="number" value={volume} onChange={setVolume} />
          <Field label="Jam Sejak Panen" type="number" value={jamSejakPanen} onChange={setJamSejakPanen} />
          <Field label="Shelf Life (jam)" type="number" value={shelfLife} onChange={setShelfLife} />
          <Field label="Nilai (Rp/kg)" type="number" value={nilaiPerKg} onChange={setNilaiPerKg} />

          <div className="col-span-2 space-y-1.5">
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
          <Button onClick={submit} className="bg-emerald-600 text-white hover:bg-emerald-700">
            Simpan Perubahan
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
