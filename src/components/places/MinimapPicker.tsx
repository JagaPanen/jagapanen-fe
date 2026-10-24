import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

const DEFAULT_CENTER: [number, number] = [-7.3, 110.4];

function pinIcon(color = "#059669") {
  const html = `<div style="
    width:22px;height:22px;border-radius:50%;
    background:${color};border:2.5px solid #fff;
    box-shadow:0 1px 4px rgba(0,0,0,.4);
  "></div>`;
  return L.divIcon({
    html,
    className: "jagapanen-minimap-pin",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function ClickToPlace({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
    // Dialogs resize the container — force Leaflet to remeasure.
    const t = window.setTimeout(() => map.invalidateSize(), 80);
    return () => window.clearTimeout(t);
  }, [lat, lng, map]);
  return null;
}

export type MinimapPickerProps = {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  height?: number;
  className?: string;
  hint?: string;
  pinColor?: string;
};

export function MinimapPicker({
  lat,
  lng,
  onChange,
  height = 168,
  className,
  hint = "Klik peta untuk menandai titik",
  pinColor,
}: MinimapPickerProps) {
  const center: [number, number] =
    Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : DEFAULT_CENTER;

  return (
    <div className={className}>
      <div
        className="overflow-hidden rounded-md border border-slate-200"
        style={{ height }}
      >
        <MapContainer
          center={center}
          zoom={11}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickToPlace onPick={onChange} />
          <Recenter lat={center[0]} lng={center[1]} />
          <Marker position={center} icon={pinIcon(pinColor)} />
        </MapContainer>
      </div>
      <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">{hint}</p>
    </div>
  );
}
