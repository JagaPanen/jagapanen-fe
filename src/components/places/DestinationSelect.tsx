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
  CUSTOM_DESTINATION_ID,
  DEFAULT_DESTINATIONS,
  customDestination,
  destinationLabel,
  findDestination,
  type DestinationOption,
} from "@/lib/places";

export type DestinationSelectProps = {
  /** Full destination value (preset or custom). */
  value: DestinationOption;
  onChange: (destination: DestinationOption) => void;
  /** Override catalog — reuse this control across the app. */
  options?: DestinationOption[];
  allowCustom?: boolean;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
};

export function DestinationSelect({
  value,
  onChange,
  options = DEFAULT_DESTINATIONS,
  allowCustom = true,
  label = "Tujuan distribusi",
  placeholder = "Pilih pasar / gudang",
  disabled,
  className,
  triggerClassName,
}: DestinationSelectProps) {
  const isCustom = value.id === CUSTOM_DESTINATION_ID;
  const selectValue = isCustom
    ? CUSTOM_DESTINATION_ID
    : (findDestination(options, value.id)?.id ?? options[0]?.id ?? "");

  const pickPreset = (id: string) => {
    if (id === CUSTOM_DESTINATION_ID) {
      const seed = findDestination(options, value.id) ?? options[0];
      onChange(
        customDestination(isCustom ? value.name : "", seed?.lat ?? -7.5, seed?.lng ?? 110.4),
      );
      return;
    }
    const next = findDestination(options, id);
    if (next) onChange(next);
  };

  return (
    <div className={className ?? "space-y-3"}>
      <div className="space-y-1.5">
        {label ? <Label className="text-xs text-zinc-600">{label}</Label> : null}
        <Select
          value={selectValue}
          disabled={disabled || options.length === 0}
          onValueChange={pickPreset}
        >
          <SelectTrigger className={triggerClassName ?? "border-slate-200 text-xs"}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {options.map((d) => (
              <SelectItem key={d.id} value={d.id} className="text-xs">
                {destinationLabel(d)}
              </SelectItem>
            ))}
            {allowCustom ? (
              <SelectItem
                value={CUSTOM_DESTINATION_ID}
                className="text-xs font-semibold text-emerald-700"
              >
                + Tujuan lain (nama + peta)
              </SelectItem>
            ) : null}
          </SelectContent>
        </Select>
      </div>

      {allowCustom && isCustom ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-600">Nama tujuan</Label>
            <Input
              value={value.name === "Tujuan kustom" ? "" : value.name}
              onChange={(e) => onChange(customDestination(e.target.value, value.lat, value.lng))}
              placeholder="Contoh: Pasar Induk Solo / Gudang Mitra"
              className="border-slate-200 text-xs"
            />
          </div>
          <MinimapPicker
            lat={value.lat}
            lng={value.lng}
            pinColor="#0f172a"
            onChange={(lat, lng) => onChange(customDestination(value.name, lat, lng))}
            hint="Klik peta untuk titik bongkar / pasar tujuan."
          />
        </div>
      ) : null}
    </div>
  );
}
