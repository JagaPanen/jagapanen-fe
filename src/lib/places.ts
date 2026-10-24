/** Shared place catalogs for pickup & destination pickers. */

export type PlacePoint = {
  name: string;
  lat: number;
  lng: number;
};

export type DestinationOption = PlacePoint & {
  /** Stable key for Select value */
  id: string;
  /** Optional UI subtitle, e.g. city */
  region?: string;
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

export const DEFAULT_DESTINATIONS: DestinationOption[] = [
  {
    id: "pasar-caringin",
    name: "Pasar Induk Caringin",
    region: "Bandung",
    lat: -6.943,
    lng: 107.576,
  },
  {
    id: "pasar-giwangan",
    name: "Pasar Induk Giwangan",
    region: "Yogyakarta",
    lat: -7.834,
    lng: 110.3912,
  },
  {
    id: "pasar-legian",
    name: "Pasar Induk Kramat Jati",
    region: "Jakarta",
    lat: -6.272,
    lng: 106.87,
  },
  {
    id: "pasar-induk-surabaya",
    name: "Pasar Induk Wonokromo",
    region: "Surabaya",
    lat: -7.302,
    lng: 112.737,
  },
  {
    id: "pasar-induk-semarang",
    name: "Pasar Johar / area induk",
    region: "Semarang",
    lat: -6.968,
    lng: 110.428,
  },
  {
    id: "pasar-induk-malang",
    name: "Pasar Besar Malang",
    region: "Malang",
    lat: -7.982,
    lng: 112.63,
  },
  {
    id: "gudang-koperasi",
    name: "Gudang Sentra Koperasi",
    region: "Magelang",
    lat: -7.502,
    lng: 110.2185,
  },
  {
    id: "tangerang-cold",
    name: "Gudang Pendingin Tangerang",
    region: "Tangerang",
    lat: -6.178,
    lng: 106.63,
  },
];

export function destinationLabel(d: DestinationOption): string {
  if (d.id === CUSTOM_DESTINATION_ID) return d.name || "Tujuan kustom";
  return d.region ? `${d.name} (${d.region})` : d.name;
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
    name: name.trim() || "Tujuan kustom",
    region: "Kustom",
    lat,
    lng,
  };
}
