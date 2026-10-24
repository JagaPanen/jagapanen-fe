export type Harvest = {
  id: string;
  komoditas: string;
  lokasi: string;
  volume: number;
  jamSejakPanen: number;
  shelfLife: number;
  kelas: "A" | "B" | "C" | "D" | "E";
  kelasLabel: string;
  nilaiPerKg: number;
  lat: number;
  lng: number;
  /** From POST /risk/score when available */
  urgency?: number;
  priorityLevel?: string;
  maxTransitHours?: number;
};

export const LOCATION_COORDINATES: Record<string, [number, number]> = {
  // Jawa Tengah / DIY
  "Titik A — Desa Sawangan": [-7.5312, 110.3541],
  "Titik A — Desa Sawangan (Magelang)": [-7.5312, 110.3541],
  "Titik A — Desa Banyuroto": [-7.5312, 110.3541],
  "Titik B — Desa Ngablak": [-7.3985, 110.3952],
  "Titik C — Desa Grabag": [-7.3684, 110.334],
  "Titik D — Wonogiri (Sentra Palawija)": [-7.8142, 110.9255],
  "Titik E — Bandungan (Sayur Daun)": [-7.2186, 110.3694],
  "Temanggung (Tembakau/Cabai)": [-7.3167, 110.1667],
  "Cepogo (Boyolali)": [-7.5186, 110.5189],
  "Kopeng (Getasan, hortikultura)": [-7.377, 110.438],
  "Dieng (Wonosobo, kentang)": [-7.21, 109.908],
  "Sleman (DIY hortikultura)": [-7.716, 110.355],
  // Jawa Barat
  "Lembang (Bandung)": [-6.816, 107.617],
  "Pangalengan (Bandung)": [-7.16, 107.57],
  "Cianjur (sayur dataran)": [-6.817, 107.142],
  "Garut (cabai/sayur)": [-7.211, 107.907],
  // Jawa Timur
  "Batu (Malang)": [-7.87, 112.528],
  "Poncokusumo (Malang)": [-8.037, 112.785],
  "Probolinggo (bawang)": [-7.755, 113.216],
  "Nganjuk (bawang merah)": [-7.604, 111.904],
  // Lainnya
  "Berastagi (Karo, Sumut)": [-3.195, 98.508],
  "Bedugul (Bali)": [-8.275, 115.166],
};

export const DEFAULT_COORDINATE: [number, number] = [-7.502, 110.2185]; // Pool Magelang

export const LOCATION_PRESETS = [
  "Titik A — Desa Sawangan (Magelang)",
  "Titik B — Desa Ngablak",
  "Titik C — Desa Grabag",
  "Titik D — Wonogiri (Sentra Palawija)",
  "Titik E — Bandungan (Sayur Daun)",
  "Temanggung (Tembakau/Cabai)",
  "Cepogo (Boyolali)",
  "Kopeng (Getasan, hortikultura)",
  "Dieng (Wonosobo, kentang)",
  "Sleman (DIY hortikultura)",
  "Lembang (Bandung)",
  "Pangalengan (Bandung)",
  "Cianjur (sayur dataran)",
  "Garut (cabai/sayur)",
  "Batu (Malang)",
  "Poncokusumo (Malang)",
  "Probolinggo (bawang)",
  "Nganjuk (bawang merah)",
  "Berastagi (Karo, Sumut)",
  "Bedugul (Bali)",
];

export const VEHICLE = {
  nama: "Pick-up Colt L300",
  kapasitas: 1000,
  pool: "Pool Koperasi Tani (Magelang)",
  tujuan: "Pasar Induk Giwangan",
  poolCoord: [-7.502, 110.2185] as [number, number],
  marketCoord: [-7.834, 110.3912] as [number, number],
};

export const INITIAL_HARVESTS: Harvest[] = [
  {
    id: "HRV-001",
    komoditas: "Tomat",
    lokasi: "Titik A — Desa Sawangan",
    volume: 300,
    jamSejakPanen: 9,
    shelfLife: 48,
    kelas: "A",
    kelasLabel: "Sangat Mudah Rusak",
    nilaiPerKg: 15000,
    lat: -7.5312,
    lng: 110.3541,
  },
  {
    id: "HRV-002",
    komoditas: "Cabai Rawit",
    lokasi: "Titik B — Desa Ngablak",
    volume: 200,
    jamSejakPanen: 6,
    shelfLife: 96,
    kelas: "B",
    kelasLabel: "Mudah Rusak",
    nilaiPerKg: 45000,
    lat: -7.3985,
    lng: 110.3952,
  },
  {
    id: "HRV-003",
    komoditas: "Kentang Granola",
    lokasi: "Titik C — Desa Grabag",
    volume: 400,
    jamSejakPanen: 24,
    shelfLife: 720,
    kelas: "D",
    kelasLabel: "Tahan Lama",
    nilaiPerKg: 12000,
    lat: -7.3684,
    lng: 110.334,
  },
  {
    id: "HRV-722",
    komoditas: "Bawang Merah",
    lokasi: "Titik D — Wonogiri (Sentra Palawija)",
    volume: 200,
    jamSejakPanen: 12,
    shelfLife: 168,
    kelas: "C",
    kelasLabel: "Cukup Tahan",
    nilaiPerKg: 28000,
    lat: -7.8142,
    lng: 110.9255,
  },
];

export const K_HANDLING: Record<Harvest["kelas"], number> = {
  A: 1.6,
  B: 1.3,
  C: 1.1,
  D: 1.0,
  E: 0.9,
};

export function urgencyScore(h: Harvest, transitHours = 2.4) {
  return Math.min(
    100,
    Math.round(((h.jamSejakPanen + transitHours) / h.shelfLife) * 100 * K_HANDLING[h.kelas]),
  );
}

export const rupiah = (n: number) => "Rp " + Math.round(Math.abs(n)).toLocaleString("id-ID") + "";

export type Mode = "cost" | "balanced" | "spoilage";

export const MODES: { id: Mode; label: string; weights: string }[] = [
  { id: "cost", label: "Cost Priority", weights: "α=0.70 · β=0.20 · γ=0.10" },
  { id: "balanced", label: "Balanced", weights: "α=0.33 · β=0.33 · γ=0.34" },
  { id: "spoilage", label: "Spoilage Priority", weights: "α=0.10 · β=0.20 · γ=0.70" },
];

export const ROUTES = {
  konvensional: {
    id: "konvensional",
    title: "Rute Konvensional (Shortest Path)",
    sequence: ["Pool", "Grabag (Kentang)", "Ngablak (Cabai)", "Banyuroto (Tomat)", "Pasar Induk"],
    jarak: "42.4 km",
    waktu: "2.1 Jam",
    biaya: 180000,
    risk: 84,
    riskLabel: "HIGH RISK",
    riskNote: "Tomat terancam rusak karena dijemput terakhir",
    susut: "180 kg tomat rusak (50% dari muatan tomat)",
    kerugian: -2700000,
    kerugianLabel: "Kerugian Ekonomi",
    badge: "Tidak Direkomendasikan",
    badgeVariant: "rose" as const,
    summaryNote: "Rute terpendek, tetapi komoditas paling rentan diangkut terakhir.",
  },
  balanced: {
    id: "balanced",
    title: "Rute Kompromi (Balanced Trade-off)",
    sequence: ["Pool", "Ngablak (Cabai)", "Banyuroto (Tomat)", "Grabag (Kentang)", "Pasar Induk"],
    jarak: "45.1 km",
    jarakNote: "+2.7 km deviasi rute",
    waktu: "2.2 Jam",
    biaya: 192000,
    biayaNote: "+Rp 12.000 tambahan BBM",
    risk: 52,
    riskLabel: "MODERATE RISK",
    riskNote: "Cabai aman, Tomat sedikit berisiko namun terselamatkan",
    susut: "50 kg susut panen",
    kerugian: -750000,
    kerugianLabel: "Kerugian Tertekan",
    badge: "Rute Kompromi Seimbang",
    badgeVariant: "amber" as const,
    summaryNote:
      "Kompromi seimbang menyeimbangkan efisiensi BBM dan penyelamatan komoditas rentan.",
  },
  rekomendasi: {
    id: "rekomendasi",
    title: "Rekomendasi JagaPanen (Spoilage-Aware)",
    sequence: ["Pool", "Banyuroto (Tomat)", "Ngablak (Cabai)", "Grabag (Kentang)", "Pasar Induk"],
    jarak: "47.8 km",
    jarakNote: "+5.4 km deviasi rute",
    waktu: "2.4 Jam",
    biaya: 205000,
    biayaNote: "+Rp 25.000 tambahan BBM",
    risk: 32,
    riskLabel: "LOW RISK",
    riskNote: "Tomat prioritas jemput pertama",
    susut: "Hanya 20 kg susut wajar",
    kerugian: -300000,
    kerugianLabel: "Kerugian Tertekan",
    badge: "Solusi Optimal Terpilih",
    badgeVariant: "emerald" as const,
    summaryNote: "Deviasi rute kecil menukar biaya BBM dengan margin komoditas yang maksimal.",
  },
};

export type ScenarioData = {
  mode: Mode;
  name: string;
  weights: string;
  recommendedRouteKey: "konvensional" | "balanced" | "rekomendasi";
  kpiLossAvoided: string;
  kpiLossSub: string;
  kpiMargin: string;
  kpiMarginSub: string;
  kpiMarginTone: "rose" | "emerald";
  impact: {
    foodLossAvoided: string;
    nilaiTerselamatkan: string;
    tambahanBiaya: string;
    netRetainedValue: string;
    narasi: string;
  };
};

export const SCENARIOS: Record<Mode, ScenarioData> = {
  cost: {
    mode: "cost",
    name: "Cost Priority",
    weights: "α=0.70 · β=0.20 · γ=0.10",
    recommendedRouteKey: "konvensional",
    kpiLossAvoided: "0 kg",
    kpiLossSub: "Baseline rute konvensional (tanpa penyelamatan susut)",
    kpiMargin: "Rp 0",
    kpiMarginSub: "Potensi rugi susut: Rp 2.700.000",
    kpiMarginTone: "rose",
    impact: {
      foodLossAvoided: "0 kg",
      nilaiTerselamatkan: "Rp 0",
      tambahanBiaya: "Rp 0",
      netRetainedValue: "Rp 0",
      narasi:
        "Rute terpendek menghemat BBM awal namun menyebabkan 180 kg tomat rusak dengan potensi kerugian ekonomi Rp 2,70 juta.",
    },
  },
  balanced: {
    mode: "balanced",
    name: "Balanced",
    weights: "α=0.33 · β=0.33 · γ=0.34",
    recommendedRouteKey: "balanced",
    kpiLossAvoided: "+130 kg",
    kpiLossSub: "Selisih susut konvensional vs rute kompromi",
    kpiMargin: "+Rp 1.638.000",
    kpiMarginSub: "Margin terselamatkan setelah deviasi BBM",
    kpiMarginTone: "emerald",
    impact: {
      foodLossAvoided: "130 kg",
      nilaiTerselamatkan: "Rp 1.650.000",
      tambahanBiaya: "-Rp 12.000",
      netRetainedValue: "+Rp 1.638.000",
      narasi:
        "Kompromi seimbang menambah 2,7 km, menyelamatkan 130 kg hasil panen dengan net retained value sebesar Rp 1,64 juta bagi koperasi.",
    },
  },
  spoilage: {
    mode: "spoilage",
    name: "Spoilage Priority",
    weights: "α=0.10 · β=0.20 · γ=0.70",
    recommendedRouteKey: "rekomendasi",
    kpiLossAvoided: "+160 kg",
    kpiLossSub: "Selisih susut konvensional vs spoilage-aware",
    kpiMargin: "+Rp 2.375.000",
    kpiMarginSub: "Nilai margin maksimal yang dipertahankan",
    kpiMarginTone: "emerald",
    impact: {
      foodLossAvoided: "160 kg",
      nilaiTerselamatkan: "Rp 2.400.000",
      tambahanBiaya: "-Rp 25.000",
      netRetainedValue: "+Rp 2.375.000",
      narasi:
        "Penambahan rute sejauh 5,4 km berhasil mempertahankan margin keuntungan sebesar Rp 2,37 juta bagi anggota koperasi.",
    },
  },
};

export function getRouteSequenceForMode(harvests: Harvest[], mode: Mode): Harvest[] {
  if (harvests.length === 0) return [];
  if (mode === "spoilage") {
    // Spoilage Priority: kelas rentan (A -> B -> C -> D) lalu urgency score tertinggi
    const classPriority: Record<string, number> = { A: 1, B: 2, C: 3, D: 4 };
    return [...harvests].sort((a, b) => {
      const pDiff = (classPriority[a.kelas] ?? 5) - (classPriority[b.kelas] ?? 5);
      if (pDiff !== 0) return pDiff;
      return b.jamSejakPanen / b.shelfLife - a.jamSejakPanen / a.shelfLife;
    });
  } else if (mode === "cost") {
    // Cost Priority: urutan geografis terpendek (dari Utara ke Selatan mendekati Yogyakarta di Selatan)
    return [...harvests].sort((a, b) => b.lat - a.lat);
  } else {
    // Balanced: kompromi seimbang (B -> A -> C -> D)
    const balancedPriority: Record<string, number> = { B: 1, A: 2, C: 3, D: 4 };
    return [...harvests].sort((a, b) => {
      const pDiff = (balancedPriority[a.kelas] ?? 5) - (balancedPriority[b.kelas] ?? 5);
      if (pDiff !== 0) return pDiff;
      return a.lat - b.lat;
    });
  }
}
