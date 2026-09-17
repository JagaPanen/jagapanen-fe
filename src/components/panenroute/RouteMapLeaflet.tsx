import { useEffect, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { Truck, Store, Sprout, Clock } from "lucide-react";
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
};

function poolIcon() {
  const html = `<div style="
    width:34px;height:34px;border-radius:50%;
    background:#0f172a;border:3px solid #ffffff;
    color:#ffffff;font-size:12px;font-weight:800;font-family:ui-sans-serif,system-ui;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 6px rgba(0,0,0,.45);
  ">P</div>`;
  return L.divIcon({
    html,
    className: "panenroute-pin-pool",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

function marketIcon() {
  const html = `<div style="
    width:34px;height:34px;border-radius:50%;
    background:#059669;border:3px solid #ffffff;
    color:#ffffff;font-size:12px;font-weight:800;font-family:ui-sans-serif,system-ui;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 6px rgba(0,0,0,.45);
  ">M</div>`;
  return L.divIcon({
    html,
    className: "panenroute-pin-market",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
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
    className: "panenroute-pin-harvest",
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

export function RouteMapLeaflet({
  harvests = [],
  mode = "spoilage",
  highlight,
}: {
  harvests?: Harvest[];
  mode?: Mode;
  highlight?: "konvensional" | "rekomendasi";
}) {
  const currentMode: Mode = mode || (highlight === "konvensional" ? "cost" : "spoilage");

  // Hitung urutan singgah untuk setiap mode secara dinamis dari array state harvests
  const costSequence = useMemo(() => getRouteSequenceForMode(harvests, "cost"), [harvests]);
  const balancedSequence = useMemo(() => getRouteSequenceForMode(harvests, "balanced"), [harvests]);
  const spoilageSequence = useMemo(() => getRouteSequenceForMode(harvests, "spoilage"), [harvests]);

  // Polylines koordinat dinamis melewati seluruh titik jemput panen aktif
  const costPositions = useMemo(
    () => [
      POOL_COORD,
      ...costSequence.map((h) => [h.lat, h.lng] as [number, number]),
      MARKET_COORD,
    ],
    [costSequence],
  );

  const balancedPositions = useMemo(
    () => [
      POOL_COORD,
      ...balancedSequence.map((h) => [h.lat, h.lng] as [number, number]),
      MARKET_COORD,
    ],
    [balancedSequence],
  );

  const spoilagePositions = useMemo(
    () => [
      POOL_COORD,
      ...spoilageSequence.map((h) => [h.lat, h.lng] as [number, number]),
      MARKET_COORD,
    ],
    [spoilageSequence],
  );

  // Seluruh koordinat untuk auto fit bounds (termasuk Wonogiri di tenggara)
  const allCoords = useMemo<[number, number][]>(
    () => [
      POOL_COORD,
      MARKET_COORD,
      ...harvests.map((h) => [h.lat, h.lng] as [number, number]),
    ],
    [harvests],
  );

  // Pemetaan nomor urutan rute aktif untuk setiap harvest
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
    <div className="relative">
      <MapContainer
        center={[-7.5, 110.35]}
        zoom={10}
        scrollWheelZoom
        className="h-[420px] w-full rounded-b-lg"
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

        {/* Marker Statis: Pool Koperasi Tani */}
        <Marker position={POOL_COORD} icon={poolIcon()}>
          <Popup>
            <div style={{ fontFamily: "ui-sans-serif, system-ui", minWidth: 180 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>{VEHICLE.pool}</p>
              <p style={{ margin: "3px 0 0", fontSize: 11, color: "#52525b" }}>
                Lokasi Awal Armada · Colt L300 (Maks 1.000 kg)
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Marker Statis: Pasar Induk Giwangan */}
        <Marker position={MARKET_COORD} icon={marketIcon()}>
          <Popup>
            <div style={{ fontFamily: "ui-sans-serif, system-ui", minWidth: 180 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>{VEHICLE.tujuan}</p>
              <p style={{ margin: "3px 0 0", fontSize: 11, color: "#52525b" }}>
                Yogyakarta · Titik Distribusi Akhir
              </p>
            </div>
          </Popup>
        </Marker>

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
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
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

                  <div style={{ margin: "8px 0 0", borderTop: "1px solid #f4f4f5", paddingTop: 6, fontSize: 11 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
                      <span style={{ color: "#71717a" }}>Volume:</span>
                      <strong style={{ color: "#18181b" }}>{h.volume} kg</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
                      <span style={{ color: "#71717a" }}>Jam Sejak Panen:</span>
                      <span style={{ color: "#18181b" }}>{h.jamSejakPanen} jam lalu</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
                      <span style={{ color: "#71717a" }}>Sisa Shelf Life:</span>
                      <strong
                        style={{
                          color: sisaShelfLife <= 24 ? "#e11d48" : "#059669",
                        }}
                      >
                        {sisaShelfLife} jam ({h.shelfLife} jam total)
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
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
            <Truck className="h-3 w-3" /> Pool
          </span>
          <span className="flex items-center gap-1">
            <Sprout className="h-3 w-3" /> Titik Panen ({harvests.length})
          </span>
          <span className="flex items-center gap-1">
            <Store className="h-3 w-3" /> Pasar
          </span>
        </div>
      </div>
    </div>
  );
}
