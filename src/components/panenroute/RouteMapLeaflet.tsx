import { useEffect, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { Car, Flag, Sprout, Clock } from "lucide-react";
import {
  VEHICLE,
  LOCATION_COORDINATES,
  DEFAULT_COORDINATE,
  getRouteSequenceForMode,
  urgencyScore,
  type Harvest,
  type Mode,
} from "./data";

const POOL_COORD: [number, number] = VEHICLE.poolCoord;
const MARKET_COORD: [number, number] = VEHICLE.marketCoord;

const CLASS_COLORS: Record<Harvest["kelas"], string> = {
  A: "#e11d48", // rose
  B: "#d97706", // amber
  C: "#0284c7", // sky
  D: "#475569", // slate
  E: "#2563eb", // blue
};

/** Inline Lucide-style SVGs for Leaflet divIcon (no React in marker HTML). */
const CAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`;

const FLAG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>`;

function startCarIcon() {
  const html = `<div style="
    width:38px;height:38px;border-radius:50%;
    background:#0f172a;border:3px solid #ffffff;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 8px rgba(0,0,0,.45);
  ">${CAR_SVG}</div>`;
  return L.divIcon({
    html,
    className: "jagapanen-pin-start",
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });
}

function finishFlagIcon() {
  const html = `<div style="
    width:38px;height:38px;border-radius:50%;
    background:#059669;border:3px solid #ffffff;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 8px rgba(0,0,0,.45);
  ">${FLAG_SVG}</div>`;
  return L.divIcon({
    html,
    className: "jagapanen-pin-finish",
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });
}

function harvestPinIcon(h: Harvest, order: number, mode: Mode) {
  const color = CLASS_COLORS[h.kelas] || "#475569";
  const badgeColor = mode === "cost" ? "#e11d48" : mode === "balanced" ? "#f59e0b" : "#10b981";

  const html = `<div style="
    position:relative;
    width:32px;height:32px;border-radius:50%;
    background:#ffffff;
    border:3.5px solid ${color};
    color:${color};
    font-size:12px;font-weight:800;font-family:ui-sans-serif,system-ui;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 6px rgba(0,0,0,.35);
  ">
    ${h.kelas}
    <span style="
      position:absolute;top:-7px;right:-7px;
      background:${badgeColor};
      color:#ffffff;font-size:10px;font-weight:800;font-family:ui-sans-serif,system-ui;
      border-radius:9999px;padding:0 5px;line-height:16px;
      box-shadow:0 1px 3px rgba(0,0,0,.4);border:1.5px solid #ffffff;
    ">#${order}</span>
  </div>`;

  return L.divIcon({
    html,
    className: "jagapanen-pin-harvest",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      map.fitBounds(L.latLngBounds(coords).pad(0.15), { animate: true });
    }
  }, [map, coords]);
  return null;
}

function parseGeoJsonLine(geometryJson?: string): [number, number][] | null {
  if (!geometryJson || geometryJson.startsWith("mock_")) return null;
  try {
    const geo = JSON.parse(geometryJson) as {
      type?: string;
      coordinates?: number[][];
    };
    if (geo?.type !== "LineString" || !Array.isArray(geo.coordinates)) return null;
    // GeoJSON is [lng, lat] → Leaflet [lat, lng]
    return geo.coordinates
      .filter((c) => Array.isArray(c) && c.length >= 2)
      .map((c) => [Number(c[1]), Number(c[0])] as [number, number]);
  } catch {
    return null;
  }
}

function resolveHarvestOrder(
  harvests: Harvest[],
  orderIds: string[] | undefined,
  fallbackMode: Mode,
): Harvest[] {
  if (orderIds && orderIds.length > 0) {
    const byId = new Map(harvests.map((h) => [h.id, h]));
    const byLabel = new Map(harvests.map((h) => [h.lokasi, h]));
    const byKomoditasLokasi = new Map(harvests.map((h) => [`${h.komoditas}|${h.lokasi}`, h]));
    const ordered: Harvest[] = [];
    for (const key of orderIds) {
      const hit =
        byId.get(key) ??
        byLabel.get(key) ??
        harvests.find((h) => h.lokasi.includes(key) || key.includes(h.lokasi)) ??
        byKomoditasLokasi.get(key);
      if (hit && !ordered.includes(hit)) ordered.push(hit);
    }
    if (ordered.length > 0) return ordered;
  }
  return getRouteSequenceForMode(harvests, fallbackMode);
}

export function RouteMapLeaflet({
  harvests = [],
  mode = "spoilage",
  highlight,
  routeGeometries,
  baselineOrderIds,
  spoilageOrderIds,
}: {
  harvests?: Harvest[];
  mode?: Mode;
  highlight?: "konvensional" | "rekomendasi";
  routeGeometries?: { baseline?: string | undefined; spoilage?: string | undefined } | undefined;
  baselineOrderIds?: string[] | undefined;
  spoilageOrderIds?: string[] | undefined;
}) {
  const currentMode: Mode = mode || (highlight === "konvensional" ? "cost" : "spoilage");

  const costSequence = useMemo(
    () => resolveHarvestOrder(harvests, baselineOrderIds, "cost"),
    [harvests, baselineOrderIds],
  );
  const balancedSequence = useMemo(() => getRouteSequenceForMode(harvests, "balanced"), [harvests]);
  const spoilageSequence = useMemo(
    () => resolveHarvestOrder(harvests, spoilageOrderIds, "spoilage"),
    [harvests, spoilageOrderIds],
  );

  const apiBaseline = useMemo(
    () => parseGeoJsonLine(routeGeometries?.baseline),
    [routeGeometries?.baseline],
  );
  const apiSpoilage = useMemo(
    () => parseGeoJsonLine(routeGeometries?.spoilage),
    [routeGeometries?.spoilage],
  );

  const fallbackDestCoords = useMemo(() => {
    const pts: [number, number][] = [];
    const seen = new Set<string>();
    for (const h of [...costSequence, ...spoilageSequence, ...balancedSequence, ...harvests]) {
      if (
        typeof h.destinationLat !== "number" ||
        typeof h.destinationLng !== "number" ||
        !Number.isFinite(h.destinationLat) ||
        !Number.isFinite(h.destinationLng)
      ) {
        continue;
      }
      const key = `${h.destinationLat.toFixed(4)},${h.destinationLng.toFixed(4)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pts.push([h.destinationLat, h.destinationLng]);
    }
    return pts.length > 0 ? pts : [MARKET_COORD];
  }, [costSequence, spoilageSequence, balancedSequence, harvests]);

  // Prefer API geometry; fall back to pickups then each order's destination
  const costPositions = useMemo(
    () =>
      apiBaseline && apiBaseline.length > 1
        ? apiBaseline
        : [
            POOL_COORD,
            ...costSequence.map((h) => [h.lat, h.lng] as [number, number]),
            ...fallbackDestCoords,
          ],
    [apiBaseline, costSequence, fallbackDestCoords],
  );

  const balancedPositions = useMemo(
    () => [
      POOL_COORD,
      ...balancedSequence.map((h) => [h.lat, h.lng] as [number, number]),
      ...fallbackDestCoords,
    ],
    [balancedSequence, fallbackDestCoords],
  );

  const spoilagePositions = useMemo(
    () =>
      apiSpoilage && apiSpoilage.length > 1
        ? apiSpoilage
        : [
            POOL_COORD,
            ...spoilageSequence.map((h) => [h.lat, h.lng] as [number, number]),
            ...fallbackDestCoords,
          ],
    [apiSpoilage, spoilageSequence, fallbackDestCoords],
  );

  // Fit to harvests + destinations + drawn polylines
  const allCoords = useMemo<[number, number][]>(() => {
    const destPts = harvests
      .filter(
        (h) =>
          typeof h.destinationLat === "number" &&
          typeof h.destinationLng === "number" &&
          Number.isFinite(h.destinationLat) &&
          Number.isFinite(h.destinationLng),
      )
      .map((h) => [h.destinationLat!, h.destinationLng!] as [number, number]);
    const pts: [number, number][] = [
      ...harvests.map((h) => [h.lat, h.lng] as [number, number]),
      ...destPts,
      ...costPositions,
      ...spoilagePositions,
    ];
    return pts.length > 0 ? pts : [POOL_COORD, MARKET_COORD];
  }, [harvests, costPositions, spoilagePositions]);

  const activePositions = useMemo(() => {
    if (currentMode === "cost") return costPositions;
    if (currentMode === "balanced") return balancedPositions;
    return spoilagePositions;
  }, [currentMode, costPositions, balancedPositions, spoilagePositions]);

  const startCoord = useMemo<[number, number]>(
    () => (activePositions.length > 0 ? activePositions[0]! : POOL_COORD),
    [activePositions],
  );

  /** Unique order destinations (user-editable) — not a single static market. */
  const destinationMarkers = useMemo(() => {
    const seen = new Set<string>();
    const markers: { key: string; lat: number; lng: number; name: string }[] = [];
    for (const h of harvests) {
      if (
        typeof h.destinationLat !== "number" ||
        typeof h.destinationLng !== "number" ||
        !Number.isFinite(h.destinationLat) ||
        !Number.isFinite(h.destinationLng)
      ) {
        continue;
      }
      const key = `${h.destinationLat.toFixed(4)},${h.destinationLng.toFixed(4)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      markers.push({
        key,
        lat: h.destinationLat,
        lng: h.destinationLng,
        name: h.destinationName || "Tujuan distribusi",
      });
    }
    if (markers.length === 0 && activePositions.length > 1) {
      const last = activePositions[activePositions.length - 1]!;
      markers.push({
        key: "route-end",
        lat: last[0],
        lng: last[1],
        name: "Titik akhir rute",
      });
    } else if (markers.length === 0) {
      markers.push({
        key: "fallback-market",
        lat: MARKET_COORD[0],
        lng: MARKET_COORD[1],
        name: VEHICLE.tujuan,
      });
    }
    return markers;
  }, [harvests, activePositions]);

  const activeOrderMap = useMemo(() => {
    const activeList =
      currentMode === "cost"
        ? costSequence
        : currentMode === "balanced"
          ? balancedSequence
          : spoilageSequence;
    const map: Record<string, number> = {};
    activeList.forEach((h, idx) => {
      map[h.id] = idx + 1;
    });
    return map;
  }, [currentMode, costSequence, balancedSequence, spoilageSequence]);

  return (
    <div className="relative w-full max-w-full">
      <MapContainer
        center={[-7.5, 110.35]}
        zoom={10}
        scrollWheelZoom
        className="h-[350px] sm:h-[450px] lg:h-[500px] w-full rounded-b-lg"
        style={{ zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds coords={allCoords} />

        {/* Rute Konvensional (Red Dashed) */}
        {costPositions.length > 2 && (
          <Polyline
            positions={costPositions}
            pathOptions={{
              color: "#F43F5E",
              dashArray: "6, 8",
              weight: currentMode === "cost" ? 6 : 3,
              opacity: currentMode === "cost" ? 1 : 0.25,
            }}
          />
        )}

        {/* Rute Kompromi (Amber Solid) */}
        {balancedPositions.length > 2 && (
          <Polyline
            positions={balancedPositions}
            pathOptions={{
              color: "#F59E0B",
              weight: currentMode === "balanced" ? 6 : 3,
              opacity: currentMode === "balanced" ? 1 : 0.25,
            }}
          />
        )}

        {/* Rute Rekomendasi Spoilage-Aware (Emerald Solid) */}
        {spoilagePositions.length > 2 && (
          <Polyline
            positions={spoilagePositions}
            pathOptions={{
              color: "#10B981",
              weight: currentMode === "spoilage" ? 6 : 3,
              opacity: currentMode === "spoilage" ? 1 : 0.25,
            }}
          />
        )}

        {/* Start: car logo at route origin */}
        <Marker position={startCoord} icon={startCarIcon()}>
          <Popup>
            <div style={{ fontFamily: "ui-sans-serif, system-ui", minWidth: 180 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>Start · {VEHICLE.pool}</p>
              <p style={{ margin: "3px 0 0", fontSize: 11, color: "#52525b" }}>
                Titik awal armada pada rute aktif
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Finish flags: one per unique order destination */}
        {destinationMarkers.map((d) => (
          <Marker key={`finish-${d.key}`} position={[d.lat, d.lng]} icon={finishFlagIcon()}>
            <Popup>
              <div style={{ fontFamily: "ui-sans-serif, system-ui", minWidth: 180 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>Finish · {d.name}</p>
                <p style={{ margin: "3px 0 0", fontSize: 11, color: "#52525b" }}>
                  Tujuan drop-off pesanan (dapat diubah di Edit Panen)
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Marker Dinamis dari Array State harvests */}
        {harvests.map((h) => {
          const order = activeOrderMap[h.id] || 1;
          const sisaShelfLife = Math.max(0, h.shelfLife - h.jamSejakPanen);
          const u = urgencyScore(h);
          return (
            <Marker
              key={h.id + h.lat + h.lng + currentMode}
              position={[h.lat, h.lng]}
              icon={harvestPinIcon(h, order, currentMode)}
            >
              <Popup>
                <div style={{ fontFamily: "ui-sans-serif, system-ui", minWidth: 200 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: "#18181b" }}>
                      {h.komoditas}
                    </p>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        backgroundColor: CLASS_COLORS[h.kelas],
                        color: "#ffffff",
                        padding: "1px 6px",
                        borderRadius: 4,
                      }}
                    >
                      Kelas {h.kelas}
                    </span>
                  </div>

                  <p style={{ margin: "3px 0 0", fontSize: 11, color: "#71717a" }}>{h.lokasi}</p>

                  <div
                    style={{
                      margin: "8px 0 0",
                      borderTop: "1px solid #f4f4f5",
                      paddingTop: 6,
                      fontSize: 11,
                    }}
                  >
                    <div
                      style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}
                    >
                      <span style={{ color: "#71717a" }}>Volume:</span>
                      <strong style={{ color: "#18181b" }}>{h.volume} kg</strong>
                    </div>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}
                    >
                      <span style={{ color: "#71717a" }}>Jam Sejak Panen:</span>
                      <span style={{ color: "#18181b" }}>{h.jamSejakPanen} jam lalu</span>
                    </div>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}
                    >
                      <span style={{ color: "#71717a" }}>Sisa Shelf Life:</span>
                      <strong
                        style={{
                          color: sisaShelfLife <= 24 ? "#e11d48" : "#059669",
                        }}
                      >
                        {sisaShelfLife} jam ({h.shelfLife} jam total)
                      </strong>
                    </div>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}
                    >
                      <span style={{ color: "#71717a" }}>Urgency:</span>
                      <span style={{ fontWeight: 700, color: u >= 60 ? "#e11d48" : "#d97706" }}>
                        {u}/100
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      margin: "8px 0 0",
                      backgroundColor:
                        currentMode === "cost"
                          ? "#fff1f2"
                          : currentMode === "balanced"
                            ? "#fffbeb"
                            : "#ecfdf5",
                      color:
                        currentMode === "cost"
                          ? "#be123c"
                          : currentMode === "balanced"
                            ? "#b45309"
                            : "#047857",
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      textAlign: "center",
                    }}
                  >
                    Urutan Rute Aktif: Stop #{order}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[500] rounded-md border border-slate-200 bg-white/95 px-3 py-2.5 shadow-sm">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Legenda Rute Aktif
        </p>
        <div
          className={
            "flex items-center gap-2 text-[11px] transition-all " +
            (currentMode === "cost" ? "font-bold text-rose-600" : "text-zinc-600 opacity-60")
          }
        >
          <span className="h-0 w-7 border-t-2 border-dashed border-rose-500" />
          Rute Konvensional {currentMode === "cost" && "(Aktif)"}
        </div>
        <div
          className={
            "mt-1 flex items-center gap-2 text-[11px] transition-all " +
            (currentMode === "balanced" ? "font-bold text-amber-600" : "text-zinc-600 opacity-60")
          }
        >
          <span className="h-[3px] w-7 rounded bg-amber-500" />
          Rute Kompromi {currentMode === "balanced" && "(Aktif)"}
        </div>
        <div
          className={
            "mt-1 flex items-center gap-2 text-[11px] transition-all " +
            (currentMode === "spoilage" ? "font-bold text-emerald-600" : "text-zinc-600 opacity-60")
          }
        >
          <span className="h-[3px] w-7 rounded bg-emerald-500" />
          Rute Spoilage-Aware {currentMode === "spoilage" && "(Aktif)"}
        </div>
        <div className="mt-2 flex items-center gap-3 border-t border-slate-100 pt-1.5 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1">
            <Car className="h-3 w-3" /> Start
          </span>
          <span className="flex items-center gap-1">
            <Sprout className="h-3 w-3" /> Titik Panen ({harvests.length})
          </span>
          <span className="flex items-center gap-1">
            <Flag className="h-3 w-3" /> Finish
          </span>
        </div>
      </div>
    </div>
  );
}
