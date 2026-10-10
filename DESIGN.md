# JagaPanen Design System Standard (DESIGN.md)

Design system and visual guidelines for **JagaPanen** (Agri-Logistics & Post-Harvest Decision Intelligence). Based on modern clean utility-first patterns (`getdesign.md` & `awesome-design-md`).

---

## 1. Color Palette

| Token / Role | Hex / Tailwind | Purpose & Application |
|---|---|---|
| **Primary Emerald** | `#059669` (`emerald-600`), `#10b981` (`emerald-500`) | Core brand color, primary CTAs, positive metrics (Food/Economic Loss Avoided), active badges. |
| **Primary Light** | `#ecfdf5` (`emerald-50`), `#d1fae5` (`emerald-100`) | Metric card backgrounds, high-priority stop tags, safe perishability highlights. |
| **Neutral Slate** | `#0f172a` (`slate-900`) to `#f8fafc` (`slate-50`) | Deep text contrast, subtle card borders (`border-slate-200`), table alternating background. |
| **Accent Amber** | `#f59e0b` (`amber-500`), `#fffbeb` (`amber-50`) | Moderate perishability warnings (Class B / Cabai), compromise optimization mode, attention tags. |
| **Danger Red** | `#ef4444` (`rose-500` / `red-500`), `#fff1f2` (`rose-50`) | Spoilage quality violations, fleet overload alerts (> 1000 kg Mitsubishi L300 capacity guardrails). |
| **Accent Blue** | `#2563eb` (`blue-600`), `#eff6ff` (`blue-50`) | Net Retained Margin financial metric card. |

---

## 2. Cards & Containers

- **Borders:** Thin, crisp structural dividers with `border border-slate-200`.
- **Corner Radius:** Modern rounded containers using `rounded-xl` (12px) for cards, dialogs, and table shells, and `rounded-2xl` (16px) for larger presentation sheets.
- **Elevation / Shadows:** Clean subtle shadows using `shadow-sm` or `shadow-xs` to keep interfaces light and avoid excessive skeuomorphism.
- **Responsive Overflow Guardrails:** All containers enforce `overflow-x-hidden` on parent boundaries with contained horizontal scrolling (`overflow-x-auto min-w-[760px]`) for tabular data.

---

## 3. Typography & Hierarchy

- **Base Font Family:** Clean modern sans-serif (`font-sans`: Inter / Plus Jakarta Sans system stack).
- **Section Headers & Card Labels:** High-contrast uppercase tracking: `text-xs font-bold uppercase tracking-wider text-slate-500` (or theme-matched e.g. `text-emerald-800`).
- **Metric Values:** Prominent, weighted numbers: `text-lg sm:text-xl font-bold` with strict overflow truncation (`truncate min-w-0`) and tooltips for full Indonesian currency values (`formatRp`).
- **Data Table Cells:** Micro typography: `text-xs` (12px) with `font-mono` on IDs and formatted numbers for scanability.

---

## 4. Uniform Loading State Architecture

To guarantee a clean initial page load without flash of unstyled/dummy content (FOUC / dummy glitch):

1. **State Initialization:**
   - Dynamic data collections (e.g. `harvests`) start as pure empty arrays `[]`.
   - Dynamic calculation comparisons start as `null`.
   - Loading indicator `isHarvestsLoading` is initialized to `true` until database resolution completes.

2. **Metric & Card Skeletons:**
   - All dynamic KPI numbers render Tailwind pulse skeletons during load:
     ```html
     <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-8 rounded w-3/4 my-1.5" />
     ```
   - Pickup route columns render uniform 3-row skeleton stops while solver runs.

3. **Table Loading State:**
   - Table displays a centralized loading row with an SVG spinner (`Loader2 animate-spin`) and subtle pulsing placeholder bars instead of hardcoded mock records (`HRV-001`).

4. **Empty State Validation:**
   - When database has 0 records, KPI cards display clean zero values (`+0 kg`, `Rp 0`) with the message: *"Belum ada data panen untuk dioptimalkan."*

---

## 5. Component Implementations

- **Action Buttons (`Button`):** Emerald primary (`bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm`). Automatically disabled with dynamic text (`"Memuat Data..."` or `"Menghitung Rute..."`) during asynchronous operations.
- **Pilot Badges:** Pill-style indicators (`rounded-full px-2.5 py-0.5 text-xs font-medium border`).
- **Perishability Status Badges:**
  - `Aman`: `bg-emerald-100 text-emerald-700`
  - `Perhatian`: `bg-amber-100 text-amber-700`
  - `Kritis`: `bg-rose-100 text-rose-700`
