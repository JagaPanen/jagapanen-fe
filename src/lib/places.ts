/** Shared place catalogs for pickup & destination pickers. */

export type PlacePoint = {
  name: string;
  lat: number;
  lng: number;
};

export type DestinationKind = "pasar" | "desa" | "gudang";

export type DestinationOption = PlacePoint & {
  /** Stable key for Select value */
  id: string;
  /** Optional UI subtitle, e.g. city */
  region?: string;
  /** Suggestion group — pasar induk, desa sentra, or gudang */
  kind?: DestinationKind;
};

export type PickupPlaceValue = {
  name: string;
  lat: number;
  lng: number;
  /** Preset key, or "custom" */
  presetKey: string;
  /** When custom: optional nearby preset used as map starting point */
  anchorKey?: string;
};

export const CUSTOM_DESTINATION_ID = "custom";
export const UNSET_DESTINATION_ID = "__unset__";

/** Map center while tujuan belum dipilih (Java corridor). */
export const DEST_MAP_CENTER: [number, number] = [-7.5, 110.35];

/**
 * Suggestion catalog only — never auto-applied as a static route end.
 * User must pick a suggestion or enter their own tujuan.
 */
export const DEFAULT_DESTINATIONS: DestinationOption[] = [
  // ── Pasar induk / wholesale hubs ──
  {
    id: "pasar-caringin",
    name: "Pasar Induk Caringin",
    region: "Bandung",
    kind: "pasar",
    lat: -6.943,
    lng: 107.576,
  },
  {
    id: "pasar-giwangan",
    name: "Pasar Induk Giwangan",
    region: "Yogyakarta",
    kind: "pasar",
    lat: -7.834,
    lng: 110.3912,
  },
  {
    id: "pasar-kramat-jati",
    name: "Pasar Induk Kramat Jati",
    region: "Jakarta",
    kind: "pasar",
    lat: -6.272,
    lng: 106.87,
  },
  {
    id: "pasar-wonokromo",
    name: "Pasar Induk Wonokromo",
    region: "Surabaya",
    kind: "pasar",
    lat: -7.302,
    lng: 112.737,
  },
  {
    id: "pasar-johar",
    name: "Pasar Johar",
    region: "Semarang",
    kind: "pasar",
    lat: -6.968,
    lng: 110.428,
  },
  {
    id: "pasar-besar-malang",
    name: "Pasar Besar Malang",
    region: "Malang",
    kind: "pasar",
    lat: -7.982,
    lng: 112.63,
  },
  {
    id: "pasar-legian-solo",
    name: "Pasar Legi / area induk Solo",
    region: "Surakarta",
    kind: "pasar",
    lat: -7.569,
    lng: 110.829,
  },
  // ── Desa / kawasan sentra pertanian (tujuan jemput atau mitra) ──
  {
    id: "desa-sawangan",
    name: "Desa Sawangan (sentra hortikultura)",
    region: "Magelang",
    kind: "desa",
    lat: -7.5312,
    lng: 110.3541,
  },
  {
    id: "desa-bandungan",
    name: "Bandungan (sayur dataran tinggi)",
    region: "Semarang",
    kind: "desa",
    lat: -7.2186,
    lng: 110.3694,
  },
  {
    id: "desa-cepogo",
    name: "Cepogo (hortikultura)",
    region: "Boyolali",
    kind: "desa",
    lat: -7.5186,
    lng: 110.5189,
  },
  {
    id: "desa-dieng",
    name: "Dieng (kentang)",
    region: "Wonosobo",
    kind: "desa",
    lat: -7.21,
    lng: 109.908,
  },
  {
    id: "desa-lembang",
    name: "Lembang (sayur & bunga)",
    region: "Bandung",
    kind: "desa",
    lat: -6.816,
    lng: 107.617,
  },
  {
    id: "desa-pangalengan",
    name: "Pangalengan (sayur & susu)",
    region: "Bandung",
    kind: "desa",
    lat: -7.16,
    lng: 107.57,
  },
  {
    id: "desa-batu",
    name: "Batu (apel & sayur)",
    region: "Malang",
    kind: "desa",
    lat: -7.87,
    lng: 112.528,
  },
  {
    id: "desa-poncokusumo",
    name: "Poncokusumo (sayur & buah)",
    region: "Malang",
    kind: "desa",
    lat: -8.037,
    lng: 112.785,
  },
  {
    id: "desa-berastagi",
    name: "Berastagi (hortikultura Karo)",
    region: "Sumut",
    kind: "desa",
    lat: -3.195,
    lng: 98.508,
  },
  // ── Gudang / cold chain (opsional) ──
  {
    id: "gudang-koperasi-magelang",
    name: "Gudang Sentra Koperasi",
    region: "Magelang",
    kind: "gudang",
    lat: -7.502,
    lng: 110.2185,
  },
  {
    id: "gudang-pendingin-tangerang",
    name: "Gudang Pendingin Tangerang",
    region: "Tangerang",
    kind: "gudang",
    lat: -6.178,
    lng: 106.63,
  },
];

export function unsetDestination(
  mapCenter: [number, number] = DEST_MAP_CENTER,
): DestinationOption {
  return {
    id: UNSET_DESTINATION_ID,
    name: "",
    lat: mapCenter[0],
    lng: mapCenter[1],
  };
}

export function isDestinationChosen(d: DestinationOption | null | undefined): boolean {
  if (!d || d.id === UNSET_DESTINATION_ID) return false;
  if (d.id === CUSTOM_DESTINATION_ID) return d.name.trim().length > 0;
  return Boolean(d.name?.trim());
}

export function destinationLabel(d: DestinationOption): string {
  if (d.id === UNSET_DESTINATION_ID) return "Pilih tujuan…";
  if (d.id === CUSTOM_DESTINATION_ID) return d.name.trim() || "Tujuan kustom";
  const kindTag =
    d.kind === "pasar" ? "Pasar" : d.kind === "desa" ? "Desa sentra" : d.kind === "gudang" ? "Gudang" : null;
  const place = d.region ? `${d.name} (${d.region})` : d.name;
  return kindTag ? `${kindTag} · ${place}` : place;
}

export function findDestination(
  options: DestinationOption[],
  nameOrId: string,
): DestinationOption | undefined {
  return options.find((d) => d.id === nameOrId || d.name === nameOrId);
}

export function customDestination(name: string, lat: number, lng: number): DestinationOption {
  return {
    id: CUSTOM_DESTINATION_ID,
    name: name.trim(),
    region: "Kustom",
    lat,
    lng,
  };
}

/** Resolve a DestinationOption from stored harvest destination fields. */
export function destinationFromCoords(
  name: string | undefined,
  lat: number | undefined,
  lng: number | undefined,
  options: DestinationOption[] = DEFAULT_DESTINATIONS,
): DestinationOption {
  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  ) {
    const byCoords = options.find(
      (d) => Math.abs(d.lat - lat) < 0.02 && Math.abs(d.lng - lng) < 0.02,
    );
    if (byCoords) return byCoords;
    if (name) {
      const byName = findDestination(options, name);
      if (byName && Math.abs(byName.lat - lat) < 0.05 && Math.abs(byName.lng - lng) < 0.05) {
        return byName;
      }
    }
    return customDestination(name || "Tujuan kustom", lat, lng);
  }
  if (name) {
    const byName = findDestination(options, name);
    if (byName) return byName;
    return customDestination(name, DEST_MAP_CENTER[0], DEST_MAP_CENTER[1]);
  }
  // No stored tujuan — user must choose (do not force a static market)
  return unsetDestination();
}
