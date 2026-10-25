import { useEffect, useRef, useState } from "react";

export interface Hero3DRouteSceneProps {
  spoilageAware: boolean;
  onSelectMode?: (spoilageAware: boolean) => void;
  /**
   * Optional public Spline `.splinecode` URL.
   * When provided, loads the external WebGL Spline runtime iframe/canvas;
   * otherwise renders our ultra-lightweight (<15KB, 60fps) 3D Isometric WebGL/Canvas
   * Harvest Route & Topographic Terrain engine with zero external network asset dependencies.
   */
  splineSceneUrl?: string;
}

interface Node3D {
  id: string;
  label: string;
  sublabel: string;
  x: number;
  y: number;
  z: number;
  color: string;
  ringColor: string;
  spoilageBadge: string;
  baselineBadge: string;
}

const ROUTE_NODES: [Node3D, ...Node3D[]] = [
  {
    id: "origin-a",
    label: "Kebun Batu (Kelas A)",
    sublabel: "Tomat & Hortikultura · Panen 05:30",
    x: -1.55,
    y: 0.34,
    z: -0.95,
    color: "#34d399",
    ringColor: "rgba(52, 211, 153, 0.45)",
    spoilageBadge: "Prioritas #1 · Segar 96%",
    baselineBadge: "Tertunda 4.5j · Risiko Tinggi",
  },
  {
    id: "hub-cold",
    label: "Hub Sortir & Cold-Box",
    sublabel: "Pujon · Konsolidasi Suhu Terjaga",
    x: -0.15,
    y: 0.22,
    z: -0.25,
    color: "#f0d078",
    ringColor: "rgba(240, 208, 120, 0.45)",
    spoilageBadge: "Detour +6 km · Shelf-Life +14j",
    baselineBadge: "Dilewati (Langsung Jalur Panas)",
  },
  {
    id: "origin-b",
    label: "Kolektor Lereng (Kelas C)",
    sublabel: "Kentang & Umbi · Tahan Simpan",
    x: -0.55,
    y: 0.08,
    z: 0.85,
    color: "#6ee7b7",
    ringColor: "rgba(110, 231, 183, 0.35)",
    spoilageBadge: "Urutan #2 · Stabil",
    baselineBadge: "Diambil Dulu (Karena Dekat)",
  },
  {
    id: "destination",
    label: "Pasar Induk & Distribusi",
    sublabel: "Surabaya · Penerimaan Lot Terkunci",
    x: 1.55,
    y: 0.05,
    z: 0.55,
    color: "#fbbf24",
    ringColor: "rgba(251, 191, 36, 0.5)",
    spoilageBadge: "Nilai Panen Terlindungi 94.2%",
    baselineBadge: "Susut Mutu Kelas A -28%",
  },
];

function project3D(
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  yaw: number,
  pitch: number,
) {
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);

  const rx = x * cosY - z * sinY;
  const rz = x * sinY + z * cosY;
  const ry = y * cosP - rz * sinP;
  const depth = y * sinP + rz * cosP + 4.6;

  const scale = Math.min(width, height) * 0.82;
  const perspective = scale / Math.max(1.8, depth);

  return {
    sx: width * 0.52 + rx * perspective,
    sy: height * 0.52 - ry * perspective,
    scale: perspective / (scale / 4.6),
    depth,
  };
}

function sampleCubicBezier3D(
  p0: [number, number, number],
  p1: [number, number, number],
  p2: [number, number, number],
  p3: [number, number, number],
  t: number,
): [number, number, number] {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return [
    uuu * p0[0] + 3 * uu * t * p1[0] + 3 * u * tt * p2[0] + ttt * p3[0],
    uuu * p0[1] + 3 * uu * t * p1[1] + 3 * u * tt * p2[1] + ttt * p3[1],
    uuu * p0[2] + 3 * uu * t * p1[2] + 3 * u * tt * p2[2] + ttt * p3[2],
  ];
}

export default function Hero3DRouteScene({
  spoilageAware,
  onSelectMode,
  splineSceneUrl,
}: Hero3DRouteSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>("origin-a");
  const [isVisible, setIsVisible] = useState(true);
  const pointerRef = useRef({ targetX: 0, targetY: 0, currentX: 0, currentY: 0 });
  const projectedNodesRef = useRef<Array<{ id: string; sx: number; sy: number; r: number }>>([]);

  // Pause 3D render loop when hero scrolled out of viewport to save battery & main thread
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setIsVisible(entry.isIntersecting);
        }
      },
      { threshold: 0.05 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (splineSceneUrl || !isVisible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId = 0;
    const startTime = performance.now();

    const updateSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = parent.getBoundingClientRect();
      canvas.width = Math.max(320, Math.floor(rect.width * dpr));
      canvas.height = Math.max(320, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateSize();
    window.addEventListener("resize", updateSize, { passive: true });

    const gridCols = 13;
    const gridRows = 13;

    const render = (now: number) => {
      const elapsed = (now - startTime) * 0.001;
      const parent = canvas.parentElement;
      const width = parent ? parent.clientWidth : 640;
      const height = parent ? parent.clientHeight : 480;

      // Smooth pointer damping for interactive 3D camera orbit
      pointerRef.current.currentX +=
        (pointerRef.current.targetX - pointerRef.current.currentX) * 0.06;
      pointerRef.current.currentY +=
        (pointerRef.current.targetY - pointerRef.current.currentY) * 0.06;

      const yaw = 0.58 + Math.sin(elapsed * 0.35) * 0.06 + pointerRef.current.currentX * 0.28;
      const pitch = 0.52 + Math.cos(elapsed * 0.28) * 0.03 + pointerRef.current.currentY * 0.16;

      ctx.clearRect(0, 0, width, height);

      // 1. Ambient 3D Stage Glow beneath terrain
      const stageGlow = ctx.createRadialGradient(
        width * 0.52,
        height * 0.54,
        18,
        width * 0.52,
        height * 0.54,
        Math.min(width, height) * 0.52,
      );
      if (spoilageAware) {
        stageGlow.addColorStop(0, "rgba(31, 107, 69, 0.38)");
        stageGlow.addColorStop(0.55, "rgba(16, 62, 42, 0.18)");
        stageGlow.addColorStop(1, "rgba(7, 21, 15, 0)");
      } else {
        stageGlow.addColorStop(0, "rgba(196, 92, 38, 0.24)");
        stageGlow.addColorStop(0.55, "rgba(30, 41, 59, 0.18)");
        stageGlow.addColorStop(1, "rgba(7, 21, 15, 0)");
      }
      ctx.fillStyle = stageGlow;
      ctx.fillRect(0, 0, width, height);

      // 2. Render 3D Topographic Wireframe Terrain (East Java Highland -> Lowland contour)
      const terrainPoints: Array<Array<{ sx: number; sy: number; elev: number }>> = [];
      for (let r = 0; r < gridRows; r++) {
        const rowArr: Array<{ sx: number; sy: number; elev: number }> = [];
        const nz = (r / (gridRows - 1) - 0.5) * 3.4;
        for (let c = 0; c < gridCols; c++) {
          const nx = (c / (gridCols - 1) - 0.5) * 3.8;
          // Highland elevation on top-left (Batu/Pujon) sloping down toward Surabaya
          const highlandPeak = Math.exp(-((nx + 1.25) ** 2 + (nz + 0.75) ** 2) * 0.85) * 0.42;
          const ridgeWave =
            Math.sin(nx * 1.9 + elapsed * 0.7) * Math.cos(nz * 1.7 + elapsed * 0.5) * 0.055;
          const elev = highlandPeak + ridgeWave - 0.16;

          const proj = project3D(nx, elev, nz, width, height, yaw, pitch);
          rowArr.push({ sx: proj.sx, sy: proj.sy, elev });
        }
        terrainPoints.push(rowArr);
      }

      ctx.lineWidth = 1;
      for (let r = 0; r < gridRows; r++) {
        const row = terrainPoints[r];
        if (!row) continue;
        ctx.beginPath();
        for (let c = 0; c < gridCols; c++) {
          const pt = row[c];
          if (!pt) continue;
          if (c === 0) ctx.moveTo(pt.sx, pt.sy);
          else ctx.lineTo(pt.sx, pt.sy);
        }
        ctx.strokeStyle = spoilageAware ? "rgba(110, 231, 183, 0.13)" : "rgba(148, 163, 184, 0.12)";
        ctx.stroke();
      }

      for (let c = 0; c < gridCols; c++) {
        ctx.beginPath();
        for (let r = 0; r < gridRows; r++) {
          const pt = terrainPoints[r]?.[c];
          if (!pt) continue;
          if (r === 0) ctx.moveTo(pt.sx, pt.sy);
          else ctx.lineTo(pt.sx, pt.sy);
        }
        ctx.strokeStyle = spoilageAware ? "rgba(52, 211, 153, 0.11)" : "rgba(148, 163, 184, 0.10)";
        ctx.stroke();
      }

      // 3. Define 3D Route Curves
      // Curve A: Baseline Shortest-Distance Route (Origin C -> Origin A late -> Destination, bypassing Cold-Box)
      const baselineCurveSeg1: [
        [number, number, number],
        [number, number, number],
        [number, number, number],
        [number, number, number],
      ] = [
        [-1.55, 0.36, -0.95],
        [-0.85, 0.25, 0.45],
        [-0.65, 0.14, 0.82],
        [-0.55, 0.1, 0.85],
      ];
      const baselineCurveSeg2: [
        [number, number, number],
        [number, number, number],
        [number, number, number],
        [number, number, number],
      ] = [
        [-0.55, 0.1, 0.85],
        [0.15, 0.16, 0.78],
        [0.85, 0.1, 0.68],
        [1.55, 0.07, 0.55],
      ];

      // Curve B: Spoilage-Aware Optimal 3D Arc (Origin A -> Cold-Box Hub -> Origin C -> Destination)
      const spoilageSeg1: [
        [number, number, number],
        [number, number, number],
        [number, number, number],
        [number, number, number],
      ] = [
        [-1.55, 0.36, -0.95],
        [-1.05, 0.72, -0.82],
        [-0.55, 0.62, -0.52],
        [-0.15, 0.24, -0.25],
      ];
      const spoilageSeg2: [
        [number, number, number],
        [number, number, number],
        [number, number, number],
        [number, number, number],
      ] = [
        [-0.15, 0.24, -0.25],
        [0.45, 0.56, -0.05],
        [1.05, 0.46, 0.25],
        [1.55, 0.07, 0.55],
      ];

      const draw3DCurve = (
        segments: Array<
          [
            [number, number, number],
            [number, number, number],
            [number, number, number],
            [number, number, number],
          ]
        >,
        strokeStyle: string,
        lineWidth: number,
        dashed: boolean,
        glowColor?: string,
      ) => {
        const pts: Array<{ sx: number; sy: number }> = [];
        const steps = 28;
        segments.forEach((seg, segIdx) => {
          for (let i = segIdx === 0 ? 0 : 1; i <= steps; i++) {
            const t = i / steps;
            const [x, y, z] = sampleCubicBezier3D(seg[0], seg[1], seg[2], seg[3], t);
            const p = project3D(x, y, z, width, height, yaw, pitch);
            pts.push({ sx: p.sx, sy: p.sy });
          }
        });

        if (glowColor) {
          ctx.save();
          ctx.beginPath();
          pts.forEach((p, idx) => {
            if (idx === 0) ctx.moveTo(p.sx, p.sy);
            else ctx.lineTo(p.sx, p.sy);
          });
          ctx.strokeStyle = glowColor;
          ctx.lineWidth = lineWidth + 6;
          ctx.lineCap = "round";
          ctx.stroke();
          ctx.restore();
        }

        ctx.save();
        ctx.beginPath();
        if (dashed) ctx.setLineDash([7, 6]);
        pts.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.sx, p.sy);
          else ctx.lineTo(p.sx, p.sy);
        });
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.restore();

        return pts;
      };

      // Draw inactive comparison route subtly, then active route prominently
      if (spoilageAware) {
        draw3DCurve([baselineCurveSeg1, baselineCurveSeg2], "rgba(148, 163, 184, 0.28)", 2, true);
        const activePts = draw3DCurve(
          [spoilageSeg1, spoilageSeg2],
          "#34d399",
          3.8,
          false,
          "rgba(52, 211, 153, 0.25)",
        );

        // Secondary feeder arc from Kolektor Kelas C into Cold-Box/Main corridor
        draw3DCurve(
          [
            [
              [-0.55, 0.1, 0.85],
              [-0.42, 0.34, 0.35],
              [-0.28, 0.32, 0.05],
              [-0.15, 0.24, -0.25],
            ],
          ],
          "rgba(240, 208, 120, 0.65)",
          2.2,
          true,
        );

        // Animated 3D Harvest Telemetry Trucks (2 staggered pulses along the spoilage-aware arc)
        if (activePts.length > 2) {
          [0, 0.48].forEach((offset, pulseIdx) => {
            const progress = (elapsed * 0.26 + offset) % 1;
            const floatIdx = progress * (activePts.length - 1);
            const idx = Math.floor(floatIdx);
            const nextIdx = Math.min(activePts.length - 1, idx + 1);
            const frac = floatIdx - idx;
            const curPt = activePts[idx];
            const nextPt = activePts[nextIdx];
            if (!curPt || !nextPt) return;
            const px = curPt.sx + (nextPt.sx - curPt.sx) * frac;
            const py = curPt.sy + (nextPt.sy - curPt.sy) * frac;

            ctx.beginPath();
            ctx.arc(px, py, 10, 0, Math.PI * 2);
            ctx.fillStyle =
              pulseIdx === 0 ? "rgba(52, 211, 153, 0.28)" : "rgba(240, 208, 120, 0.28)";
            ctx.fill();

            ctx.beginPath();
            ctx.arc(px, py, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = pulseIdx === 0 ? "#ecfdf5" : "#fef08a";
            ctx.fill();
          });
        }
      } else {
        draw3DCurve([spoilageSeg1, spoilageSeg2], "rgba(52, 211, 153, 0.2)", 2, true);
        const baselinePts = draw3DCurve(
          [baselineCurveSeg1, baselineCurveSeg2],
          "#f97316",
          3.4,
          true,
          "rgba(249, 115, 22, 0.2)",
        );

        if (baselinePts.length > 2) {
          const progress = (elapsed * 0.19) % 1;
          const idx = Math.floor(progress * (baselinePts.length - 1));
          const pt = baselinePts[idx];
          if (pt) {
            ctx.beginPath();
            ctx.arc(pt.sx, pt.sy, 9, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(249, 115, 22, 0.3)";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(pt.sx, pt.sy, 4, 0, Math.PI * 2);
            ctx.fillStyle = "#fed7aa";
            ctx.fill();
          }
        }
      }

      // 4. Render 3D Nodes & Vertical Elevation Pillars
      const nextProjectedNodes: Array<{
        id: string;
        sx: number;
        sy: number;
        r: number;
      }> = [];

      ROUTE_NODES.forEach((node) => {
        const top = project3D(node.x, node.y + 0.14, node.z, width, height, yaw, pitch);
        const ground = project3D(node.x, -0.12, node.z, width, height, yaw, pitch);

        // Vertical drop pillar to ground plane
        ctx.beginPath();
        ctx.moveTo(top.sx, top.sy);
        ctx.lineTo(ground.sx, ground.sy);
        ctx.strokeStyle = "rgba(232, 242, 236, 0.28)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Ground shadow ring
        ctx.beginPath();
        ctx.ellipse(ground.sx, ground.sy, 10 * ground.scale, 5 * ground.scale, 0, 0, Math.PI * 2);
        ctx.fillStyle = node.ringColor;
        ctx.fill();

        const isHovered = hoveredNode === node.id;
        const pulseRadius = (isHovered ? 16 : 12) + Math.sin(elapsed * 3 + node.x) * 2.2;

        ctx.beginPath();
        ctx.arc(top.sx, top.sy, pulseRadius, 0, Math.PI * 2);
        ctx.fillStyle = node.ringColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(top.sx, top.sy, isHovered ? 7.5 : 6, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#07150f";
        ctx.stroke();

        // Compact floating 3D callout label right on canvas
        const labelY = top.sy - 18;
        ctx.font = "600 11px 'Source Sans 3', system-ui, sans-serif";
        const textWidth = ctx.measureText(node.label).width;
        const boxW = textWidth + 16;
        const boxH = 22;
        const boxX = top.sx - boxW / 2;
        const boxY = labelY - boxH;

        ctx.fillStyle = isHovered ? "rgba(15, 61, 46, 0.92)" : "rgba(7, 21, 15, 0.78)";
        ctx.strokeStyle = isHovered ? "rgba(240, 208, 120, 0.75)" : "rgba(213, 224, 216, 0.22)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ecfdf5";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.label, top.sx, boxY + boxH / 2);

        nextProjectedNodes.push({
          id: node.id,
          sx: top.sx,
          sy: top.sy,
          r: 24,
        });
      });

      projectedNodesRef.current = nextProjectedNodes;
      animationFrameId = window.requestAnimationFrame(render);
    };

    animationFrameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updateSize);
    };
  }, [spoilageAware, hoveredNode, isVisible, splineSceneUrl]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    pointerRef.current.targetX = nx;
    pointerRef.current.targetY = ny;

    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    const hit = projectedNodesRef.current.find(
      (n) => Math.hypot(n.sx - localX, n.sy - localY) <= n.r,
    );
    if (hit && hit.id !== hoveredNode) {
      setHoveredNode(hit.id);
    }
  };

  const handlePointerLeave = () => {
    pointerRef.current.targetX = 0;
    pointerRef.current.targetY = 0;
  };

  const activeNode = ROUTE_NODES.find((n) => n.id === hoveredNode) ?? ROUTE_NODES[0];

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative h-full min-h-[380px] w-full select-none overflow-hidden rounded-3xl border border-emerald-300/15 bg-[#07150f]/75 shadow-[0_32px_80px_-24px_rgba(0,0,0,0.65)] backdrop-blur-md sm:min-h-[450px]"
    >
      {/* Top interactive 3D HUD bar */}
      <div className="pointer-events-auto absolute inset-x-4 top-4 z-20 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#0a1f16]/80 px-3.5 py-2 text-xs text-emerald-50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              spoilageAware
                ? "bg-emerald-400 shadow-[0_0_10px_#34d399]"
                : "bg-orange-400 shadow-[0_0_10px_#fb923c]"
            }`}
          />
          <span className="font-semibold tracking-wide text-white">
            Simulasi Rute 3D Interaktif
          </span>
          <span className="hidden text-emerald-200/60 sm:inline">
            · Geser kursor untuk memutar peta
          </span>
        </div>
        {onSelectMode && (
          <div className="flex items-center gap-1 rounded-xl bg-black/35 p-1 ring-1 ring-white/10">
            <button
              type="button"
              onClick={() => onSelectMode(true)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                spoilageAware
                  ? "bg-(--jp-sun) text-(--jp-ink) shadow-sm"
                  : "text-emerald-100/75 hover:text-white"
              }`}
            >
              Spoilage-Aware
            </button>
            <button
              type="button"
              onClick={() => onSelectMode(false)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                !spoilageAware
                  ? "bg-orange-400/90 text-slate-950 shadow-sm"
                  : "text-emerald-100/75 hover:text-white"
              }`}
            >
              Baseline (Km)
            </button>
          </div>
        )}
      </div>

      {/* Optional Spline Scene Embed OR Zero-Dependency 60fps 3D Canvas */}
      {splineSceneUrl ? (
        <iframe
          src={splineSceneUrl}
          title="Peta Rute 3D Panenlink"
          className="h-full w-full border-0"
          loading="lazy"
        />
      ) : (
        <canvas
          ref={canvasRef}
          className="block h-full w-full cursor-grab active:cursor-grabbing"
          aria-label="Visualisasi 3D rute pengiriman panen dari kebun ke pasar induk"
        />
      )}

      {/* Bottom Floating Glassmorphic Telemetry HUD */}
      <div className="pointer-events-auto absolute inset-x-4 bottom-4 z-20 grid gap-2.5 sm:grid-cols-12">
        <div className="rounded-2xl border border-white/12 bg-[#0b2319]/85 p-3 text-left backdrop-blur-md sm:col-span-7">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/80">
              Titik Fokus Rute (Klik/Hover Node)
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                spoilageAware
                  ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30"
                  : "bg-orange-500/20 text-orange-200 ring-1 ring-orange-400/30"
              }`}
            >
              {spoilageAware ? activeNode.spoilageBadge : activeNode.baselineBadge}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-white">{activeNode.label}</p>
          <p className="text-xs text-emerald-100/70">{activeNode.sublabel}</p>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-white/12 bg-[#0b2319]/85 p-3 text-left backdrop-blur-md sm:col-span-5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/80">
            Status Kualitas Saat Tiba
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold tracking-tight text-white">
              {spoilageAware ? "94.2% Utuh" : "71.8% Utuh"}
            </span>
            <span
              className={`text-xs font-semibold ${
                spoilageAware ? "text-emerald-300" : "text-orange-300"
              }`}
            >
              {spoilageAware ? "-38% Risiko Busuk" : "+28% Susut Kelas A"}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                spoilageAware ? "w-[94%] bg-emerald-400" : "w-[72%] bg-orange-400"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
