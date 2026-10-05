# JagaPanen — Post-Harvest Decision Intelligence

Create a complete, single-page enterprise web application named "JagaPanen — Post-Harvest Decision Intelligence".

This system is a decision-support platform designed for Agricultural Cooperatives (Koperasi Tani) to optimize fresh crop distribution by minimizing spoilage risk rather than merely finding the shortest route.

STRICT PRODUCT DIRECTIVE (SOW v2):

- DO NOT build harvest prediction, machine learning yield forecasts, weather forecasting, or future date confidence scores.

- The system operates EXCLUSIVELY on actual, ready-to-ship harvest data.

- The core value proposition: Shortest route ≠ Best route when perishable crops are involved.

1. TECH STACK & DESIGN SYSTEM

- Modern React, Tailwind CSS, Lucide icons, and shadcn/ui components.

- Color Palette: Enterprise clean. Slate backgrounds (bg-slate-50 / bg-white cards), dark zinc text (zinc-900), subtle borders (slate-200), with Emerald/Teal accents for recommended status and Rose/Red for high-risk warnings.

- Layout: High information density, compact padding, responsive desktop-first layout.

2. PRE-POPULATED TEST DATA (MOCK DATASET)

Hardcode this baseline demonstration dataset directly into React state:

- Vehicle: 1 unit Pick-up Colt L300 (Kapasitas Maksimal: 1.000 kg). Lokasi Awal: Pool Koperasi Tani (Magelang).

- Titik Panen Aktual:

  * Titik A (Desa Banyuroto): Tomat 300 kg | Waktu Panen: 9 jam lalu | Shelf-life: 48 jam | Kelas A (Sangat Mudah Rusak) | Nilai: Rp 15.000/kg

  * Titik B (Desa Ngablak): Cabai Rawit 200 kg | Waktu Panen: 6 jam lalu | Shelf-life: 96 jam | Kelas B (Mudah Rusak) | Nilai: Rp 45.000/kg

  * Titik C (Desa Grabag): Kentang Granola 400 kg | Waktu Panen: 24 jam lalu | Shelf-life: 720 jam | Kelas D (Tahan Lama) | Nilai: Rp 12.000/kg

  Total Volume: 900 kg (Aman terhadap kapasitas 1.000 kg / Utilisasi 90%).

- Titik Distribusi Akhir: Pasar Induk Giwangan.

3. UI STRUCTURE & LAYOUT

A. HEADER & KPI SUMMARY BAR

- App title: "JagaPanen" with subtitle "Post-Harvest Logistics Orchestration".

- Badge: "Pilot: Koperasi Tani Maju Bersama".

- 4 Quick Stat Cards:

  * Total Muatan Aktif: 900 kg (Kapasitas Terisi: 90%)

  * Komoditas Kritis: 1 Titik (Tomat - Kelas A)

  * Estimated Food Loss Avoided: +160 kg

  * Net Retained Margin: +Rp 2.375.000 (Highlighted in Green)

B. TOP CONTROL BAR (SCENARIO CONTROLLER)

- Optimization Mode Switcher (Tab/Segmented Control):

  * "Cost Priority" (Bobot: α=0.70, β=0.20, γ=0.10)

  * "Balanced" (Bobot: α=0.33, β=0.33, γ=0.34)

  * "Spoilage Priority" (Bobot: α=0.10, β=0.20, γ=0.70) -> [Default Active]

- Action Button: "Tambah Data Panen" (Triggers a modal to input new harvest records).

- Info Button: "Transparansi Formula" (Opens dialog explaining Spoilage Risk Formula).

C. MAIN WORKSPACE (SPLIT 50/50)

LEFT PANEL: INTERACTIVE ROUTE MAP (Use Leaflet or an interactive SVG Mock Map)

- Render the route network connecting: Pool Koperasi -> Titik A, Titik B, Titik C -> Pasar Induk.

- Draw 2 distinct paths:

  * Red Dashed Line: Rute Konvensional (Shortest Path: Pool -> C -> B -> A -> Pasar).

  * Solid Emerald Line: Rute Rekomendasi (Spoilage-Aware: Pool -> A -> B -> C -> Pasar).

- Interactive waypoint markers with tooltips showing commodity name, weight, and hours since harvest.

RIGHT PANEL: SIDE-BY-SIDE DECISION COMPARISON (CRUCIAL DEMO FEATURE)

Two cards placed side-by-side or cleanly stacked for direct comparison:

Card 1: "Rute Konvensional (Shortest Path)"

- Status: Tidak Direkomendasikan (Red/Rose Badge)

- Sequence: Pool -> Grabag (Kentang) -> Ngablak (Cabai) -> Banyuroto (Tomat) -> Pasar

- Jarak & Waktu: 42.4 km | 2.1 Jam

- Biaya Operasional Kendaraan: Rp 180.000

- Spoilage Risk Score: 84/100 (HIGH RISK - Tomat terancam rusak karena dijemput terakhir)

- Estimasi Susut Panen: 180 kg tomat rusak (50% dari muatan tomat)

- Kerugian Ekonomi: -Rp 2.700.000

Card 2: "Rekomendasi JagaPanen (Spoilage-Aware)"

- Status: Solusi Optimal Terpilih (Emerald Green Badge)

- Sequence: Pool -> Banyuroto (Tomat) -> Ngablak (Cabai) -> Grabag (Kentang) -> Pasar

- Jarak & Waktu: 47.8 km (+5.4 km deviasi rute) | 2.4 Jam

- Biaya Operasional Kendaraan: Rp 205.000 (+Rp 25.000 tambahan BBM)

- Spoilage Risk Score: 32/100 (LOW RISK - Tomat segera masuk pengangkutan aman)

- Estimasi Susut Panen: Hanya 20 kg susut wajar

- Kerugian Tertekan: -Rp 300.000

BOTTOM COMPARISON HIGHLIGHT:

"ANALISIS DAMPAK EKONOMI BERSIH"

- Food Loss Terselamatkan: 160 kg

- Nilai Komoditas Terselamatkan: Rp 2.400.000

- Tambahan Biaya Operasional: -Rp 25.000

- Keuntungan Ekonomi Bersih (Net Retained Value): +Rp 2.375.000

- Narasi Evaluasi: "Penambahan rute sejauh 5,4 km berhasil mempertahankan margin keuntungan sebesar Rp 2,37 juta bagi anggota koperasi."

D. DATA PANEN AKTUAL TABLE (Placed below or inside a secondary tab)

A clean data table listing active harvest batches:

- Harvest ID | Komoditas | Lokasi | Volume (kg) | Jam Sejak Panen | Shelf Life | Kelas Kerentanan | Urgency Score | Status

Support simple client-side search and filtering.

E. FORMULA POPUP MODAL

When clicking "Transparansi Formula", display:

- Formula: Spoilage Risk = min(100, ((t_harvest + t_transit) / ShelfLife) * 100 * k_handling)

- Objective Function: Total Cost = α(Travel Cost) + β(Detour Cost) + γ(Spoilage Risk)

- Clear explanation of each parameter so judges understand the calculation is deterministic and transparent.

4. INTERACTION BEHAVIORS

- Clicking between "Cost Priority" and "Spoilage Priority" switches the primary highlighted recommendation. In Cost Priority, Card 1 becomes highlighted; in Spoilage Priority, Card 2 is highlighted.

- Clean transitions, tooltips on hover for all mathematical terms, and professional typography throughout.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://spoilage-route-planner.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9eaefdad-cd63-43b4-a672-1f7140cffbc7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
