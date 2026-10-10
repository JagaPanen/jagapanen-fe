# JagaPanen

Single-page decision-support app for an agricultural cooperative. It plans pickup order from ready-to-ship harvests so perishable crops are collected before they spoil. The comparison is a shortest-path baseline against a spoilage-aware route. The score is deterministic: hours since harvest, transit time, shelf life, and a handling factor. There is no yield forecast or weather model.

## Stack

- TanStack Start and React Router, React 19, Vite 8
- Tailwind CSS and shadcn/ui
- Leaflet for the pickup map
- Nitro (`cloudflare-module`) for the production server and the `/api` proxy

## What the screen does

The header shows the JagaPanen logo, the pilot badge **Koperasi Tani Maju Bersama**, and a connection badge. **Backend Active** appears when `GET /api/commodities` and `GET /api/vehicles` both succeed. Otherwise the badge reads **Standalone Demo** and the comparison uses the client-side fallback.

The sticky bar has two views:

- **Komparasi Skenario** shows four impact cards (food loss avoided, economic loss avoided, extra fuel cost, net retained margin) and two route cards: **Rute Konvensional (Baseline)** and **Rute JagaPanen (Spoilage-Aware)**.
- **Peta Penjemputan** draws the pool, harvest points, and destination on a Leaflet map.

**Kalkulasi Ulang Rute** posts the current table to `POST /api/scenarios/run-dynamic` with `mode: "spoilage_priority"`. The button stays disabled while a run is in progress or while total volume is over the vehicle capacity.

Other actions:

- **Database Parameter Komoditas** reads the commodity catalog.
- **Laporan Uji QA & Solver** opens the test report dialog.
- **Transparansi Formula** shows `Spoilage Risk = min(100, ((t_harvest + t_transit) / ShelfLife) × 100 × k_handling)` and `Total Cost = α(Travel Cost) + β(Detour Cost) + γ(Spoilage Risk)`. Handling factors are A=1.6, B=1.3, C=1.1, D=1.0, E=0.9.
- **Tambah Data Panen** appends a row. The table supports search, edit, and delete.

## Seed data

The vehicle is one Pick-up Colt L300, capacity 1,000 kg, starting at Pool Koperasi Tani (Magelang) and ending at Pasar Induk Giwangan.

| ID | Commodity | Location | Volume | Hours since harvest | Shelf life | Class |
| --- | --- | --- | --- | --- | --- | --- |
| HRV-001 | Tomat | Titik A — Desa Sawangan | 300 kg | 9 | 48 h | A |
| HRV-002 | Cabai Rawit | Titik B — Desa Ngablak | 200 kg | 6 | 96 h | B |
| HRV-003 | Kentang Granola | Titik C — Desa Grabag | 400 kg | 24 | 720 h | D |
| HRV-722 | Bawang Merah | Titik D — Wonogiri | 200 kg | 12 | 168 h | C |

That seed totals 1,100 kg, so the overload banner is visible and route recalculation is locked until a row is removed. The first comparison paint uses the first three rows (900 kg) through the client optimizer.

## API

The browser calls `VITE_API_BASE_URL` (default `/api`). In dev, Vite proxies that prefix to `https://services.panenlink.id/api/v1`. `/api/health` and `/health` are rewritten to `https://services.panenlink.id/health`. The same proxy lives in `src/server.ts` for the Nitro server.

Copy `.env.example` to `.env` for local overrides:

```sh
VITE_API_BASE_URL=/api
```

Set `VITE_API_BASE_URL` to the public API origin when the host will not proxy `/api`. The remote API must allow the page origin.

## Scripts

Requires Node.js and npm.

```sh
npm i
npm run dev      # http://localhost:3000
npm run build    # prerender + Nitro bundle
npm run preview
npm test         # tests/audit.test.mjs, needs a prior build and a reachable API
npm run lint
```

`npm run build` prerenders `/` and writes:

- `dist/index.html`, `dist/assets/`, and the public files. This folder can be hosted as a static site.
- `dist/server/` for the Nitro/Cloudflare worker, including the `/api` proxy.

A static host serves the page and hydrates it. Live catalog and route runs still need something answering `/api`, or a rebuild whose `VITE_API_BASE_URL` points at the public API. Without that, the screen stays on the standalone demo.
