import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { type Harvest, type Mode } from "./data";

const RouteMapLeaflet = lazy(() =>
  import("@/components/panenroute/RouteMapLeaflet").then((m) => ({ default: m.RouteMapLeaflet })),
);

export function RouteMap({
  harvests = [],
  mode = "spoilage",
  highlight,
}: {
  harvests?: Harvest[];
  mode?: Mode;
  highlight?: "konvensional" | "rekomendasi";
}) {
  const currentMode: Mode = mode || (highlight === "konvensional" ? "cost" : "spoilage");

  return (
    <div className="relative w-full max-w-full rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 px-3.5 sm:px-4 py-2.5">
        <h2 className="text-sm font-semibold text-zinc-900">Peta Jaringan Rute</h2>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-zinc-600">
          <span
            className={
              "flex items-center gap-1.5 transition-all duration-200 " +
              (currentMode === "cost" ? "font-bold text-rose-600" : "text-zinc-500 opacity-70")
            }
          >
            <span className="h-0.5 w-5 border-t-2 border-dashed border-rose-500" /> Konvensional
          </span>
          <span
            className={
              "flex items-center gap-1.5 transition-all duration-200 " +
              (currentMode === "balanced" ? "font-bold text-amber-600" : "text-zinc-500 opacity-70")
            }
          >
            <span className="h-0.5 w-5 bg-amber-500" /> Kompromi
          </span>
          <span
            className={
              "flex items-center gap-1.5 transition-all duration-200 " +
              (currentMode === "spoilage" ? "font-bold text-emerald-600" : "text-zinc-500 opacity-70")
            }
          >
            <span className="h-0.5 w-5 bg-emerald-600" /> Spoilage-Aware
          </span>
        </div>
      </div>

      <ClientOnly
        fallback={
          <div className="flex h-[350px] sm:h-[450px] lg:h-[500px] w-full items-center justify-center text-xs text-zinc-400">
            Memuat peta…
          </div>
        }
      >
        <Suspense
          fallback={
            <div className="flex h-[350px] sm:h-[450px] lg:h-[500px] w-full items-center justify-center text-xs text-zinc-400">
              Memuat peta…
            </div>
          }
        >
          <RouteMapLeaflet harvests={harvests} mode={currentMode} />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
