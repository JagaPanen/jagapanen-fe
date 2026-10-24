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
  DEST_MAP_CENTER,
  UNSET_DESTINATION_ID,
  customDestination,
  destinationLabel,
  findDestination,
  unsetDestination,
  type DestinationOption,
} from "@/lib/places";

export type DestinationSelectProps = {
  /** Full destination value (suggestion, custom, or unset). */
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

function groupOptions(options: DestinationOption[]) {
  const pasar = options.filter((d) => d.kind === "pasar" || (!d.kind && d.id.startsWith("pasar")));
  const desa = options.filter((d) => d.kind === "desa");
  const gudang = options.filter((d) => d.kind === "gudang");
  const other = options.filter(
    (d) => !pasar.includes(d) && !desa.includes(d) && !gudang.includes(d),
  );
  return { pasar, desa, gudang, other };
}

export function DestinationSelect({
  value,
  onChange,
  options = DEFAULT_DESTINATIONS,
  allowCustom = true,
  label = "Tujuan distribusi",
  placeholder = "Pilih saran tempat atau isi sendiri",
  disabled,
  className,
  triggerClassName,
}: DestinationSelectProps) {
  const isUnset = value.id === UNSET_DESTINATION_ID;
  const isCustom = value.id === CUSTOM_DESTINATION_ID;
  const selectValue = isUnset
    ? UNSET_DESTINATION_ID
    : isCustom
      ? CUSTOM_DESTINATION_ID
      : (findDestination(options, value.id)?.id ?? UNSET_DESTINATION_ID);

  const { pasar, desa, gudang, other } = groupOptions(options);

  const pickPreset = (id: string) => {
    if (id === UNSET_DESTINATION_ID) {
      onChange(unsetDestination());
      return;
    }
    if (id === CUSTOM_DESTINATION_ID) {
      const seed = findDestination(options, value.id);
      onChange(
        customDestination(
          isCustom && value.name !== "Tujuan kustom" ? value.name : "",
          seed?.lat ?? DEST_MAP_CENTER[0],
          seed?.lng ?? DEST_MAP_CENTER[1],
        ),
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
          <SelectContent className="max-h-72">
            <SelectItem value={UNSET_DESTINATION_ID} className="text-xs text-zinc-500">
              {placeholder}
            </SelectItem>

            {pasar.length > 0 ? (
              <>
                <SelectItem
                  value="__hdr_pasar"
                  disabled
                  className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400"
                >
                  Pasar induk
                </SelectItem>
                {pasar.map((d) => (
                  <SelectItem key={d.id} value={d.id} className="text-xs">
                    {destinationLabel(d)}
                  </SelectItem>
                ))}
              </>
            ) : null}

            {desa.length > 0 ? (
              <>
                <SelectItem
                  value="__hdr_desa"
                  disabled
                  className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400"
                >
                  Desa / kawasan sentra
                </SelectItem>
                {desa.map((d) => (
                  <SelectItem key={d.id} value={d.id} className="text-xs">
                    {destinationLabel(d)}
                  </SelectItem>
                ))}
              </>
            ) : null}

            {gudang.length > 0 ? (
              <>
                <SelectItem
                  value="__hdr_gudang"
                  disabled
                  className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400"
                >
                  Gudang
                </SelectItem>
                {gudang.map((d) => (
                  <SelectItem key={d.id} value={d.id} className="text-xs">
                    {destinationLabel(d)}
                  </SelectItem>
                ))}
              </>
            ) : null}

            {other.map((d) => (
              <SelectItem key={d.id} value={d.id} className="text-xs">
                {destinationLabel(d)}
              </SelectItem>
            ))}

            {allowCustom ? (
              <SelectItem
                value={CUSTOM_DESTINATION_ID}
                className="text-xs font-semibold text-emerald-700"
              >
                + Tujuan sendiri (nama + peta)
              </SelectItem>
            ) : null}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-zinc-500">
          Saran: pasar induk & desa sentra pertanian. Atau isi tujuan sendiri sesuai order.
        </p>
      </div>

      {allowCustom && isCustom ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-600">Nama tujuan</Label>
            <Input
              value={value.name}
              onChange={(e) => onChange(customDestination(e.target.value, value.lat, value.lng))}
              placeholder="Contoh: Pasar Induk Solo / Gudang Mitra / Desa mitra"
              className="border-slate-200 text-xs"
            />
          </div>
          <MinimapPicker
            lat={value.lat}
            lng={value.lng}
            pinColor="#0f172a"
            onChange={(lat, lng) => onChange(customDestination(value.name, lat, lng))}
            hint="Klik peta untuk titik bongkar / tujuan order."
          />
        </div>
      ) : null}
    </div>
  );
}
