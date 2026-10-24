import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MinimapPicker } from "@/components/places/MinimapPicker";
import {
  DEFAULT_COORDINATE,
  LOCATION_COORDINATES,
  LOCATION_PRESETS,
} from "@/components/panenroute/data";
import type { PickupPlaceValue } from "@/lib/places";

const CUSTOM_KEY = "custom";

export type PickupLocationFieldProps = {
  value: PickupPlaceValue;
  onChange: (next: PickupPlaceValue) => void;
  presets?: string[];
  coordinates?: Record<string, [number, number]>;
  label?: string;
  className?: string;
};

function coordsFor(
  name: string,
  coordinates: Record<string, [number, number]> = LOCATION_COORDINATES,
): [number, number] {
  return coordinates[name] ?? DEFAULT_COORDINATE;
}

export function pickupFromPreset(
  presetName: string,
  coordinates: Record<string, [number, number]> = LOCATION_COORDINATES,
): PickupPlaceValue {
  const [lat, lng] = coordsFor(presetName, coordinates);
  return { name: presetName, lat, lng, presetKey: presetName };
}

export function pickupFromHarvestLokasi(
  lokasi: string,
  lat: number,
  lng: number,
  presets: string[] = LOCATION_PRESETS,
): PickupPlaceValue {
  if (presets.includes(lokasi)) {
    return { name: lokasi, lat, lng, presetKey: lokasi };
  }
  const anchor =
    presets.find((p) => {
      const c = LOCATION_COORDINATES[p];
      return c && Math.abs(c[0] - lat) < 1e-4 && Math.abs(c[1] - lng) < 1e-4;
    }) ??
    presets[0] ??
    "Titik A — Desa Sawangan";

  return {
    name: lokasi,
    lat,
    lng,
    presetKey: CUSTOM_KEY,
    anchorKey: anchor,
  };
}

export function PickupLocationField({
  value,
  onChange,
  presets = LOCATION_PRESETS,
  coordinates = LOCATION_COORDINATES,
  label = "Lokasi titik panen",
  className,
}: PickupLocationFieldProps) {
  const isCustom = value.presetKey === CUSTOM_KEY;

  const selectPreset = (key: string) => {
    if (key === CUSTOM_KEY) {
      const start = coordsFor(presets[0] || "", coordinates);
      onChange({
        name: value.name && !presets.includes(value.name) ? value.name : "",
        lat: value.presetKey === CUSTOM_KEY ? value.lat : start[0],
        lng: value.presetKey === CUSTOM_KEY ? value.lng : start[1],
        presetKey: CUSTOM_KEY,
      });
      return;
    }
    const [lat, lng] = coordsFor(key, coordinates);
    onChange({ name: key, lat, lng, presetKey: key });
  };

  const setCustomName = (name: string) => {
    onChange({ ...value, name, presetKey: CUSTOM_KEY });
  };

  return (
    <div className={className ?? "col-span-1 space-y-3 sm:col-span-2"}>
      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-600">{label}</Label>
        <Select value={isCustom ? CUSTOM_KEY : value.presetKey} onValueChange={selectPreset}>
          <SelectTrigger className="border-slate-200 text-xs">
            <SelectValue placeholder="Pilih desa / sentra" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {presets.map((loc) => (
              <SelectItem key={loc} value={loc} className="text-xs">
                {loc}
              </SelectItem>
            ))}
            <SelectItem value={CUSTOM_KEY} className="text-xs font-semibold text-emerald-700">
              + Lokasi lain (klik di peta)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isCustom ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-600">Nama lokasi</Label>
            <Input
              value={value.name}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Contoh: Desa Selo, Boyolali"
              className="border-slate-200 text-xs"
            />
          </div>
          <MinimapPicker
            lat={value.lat}
            lng={value.lng}
            onChange={(lat, lng) => onChange({ ...value, lat, lng, presetKey: CUSTOM_KEY })}
            hint="Geser/klik peta ke titik panen di mana pun di Indonesia. Nama di atas untuk label laporan."
          />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 rounded border border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] text-zinc-600">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <span className="truncate">Titik jemput: {value.name}</span>
          </div>
          <MinimapPicker
            lat={value.lat}
            lng={value.lng}
            onChange={(lat, lng) =>
              onChange({
                name: value.name,
                lat,
                lng,
                presetKey: CUSTOM_KEY,
                anchorKey: value.presetKey,
              })
            }
            height={140}
            hint="Klik peta untuk menyesuaikan titik (otomatis jadi lokasi kustom)."
          />
        </div>
      )}
    </div>
  );
}
