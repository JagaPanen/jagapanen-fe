import { VEHICLE, type Harvest } from "@/components/panenroute/data";

const HANDLING_FACTOR: Record<Harvest["kelas"], number> = {
  A: 1.6,
  B: 1.3,
  C: 1.1,
  D: 1.0,
  E: 0.9,
};

export function buildClientOptimizationInput(harvests: Harvest[]) {
  return {
    destination: {
      lat: VEHICLE.marketCoord[0],
      lng: VEHICLE.marketCoord[1],
      name: VEHICLE.tujuan,
    },
    vehicles: [
      {
        name: VEHICLE.nama,
        location: {
          lat: VEHICLE.poolCoord[0],
          lng: VEHICLE.poolCoord[1],
          name: VEHICLE.pool,
        },
        capacity_kg: VEHICLE.kapasitas,
        cost_per_km_idr: 5000,
      },
    ],
    harvests,
  };
}

export function buildDynamicScenarioPayload(harvests: Harvest[]) {
  return {
    scenario_name: "Live Planning Run",
    destination: {
      lat: VEHICLE.marketCoord[0],
      lng: VEHICLE.marketCoord[1],
      name: VEHICLE.tujuan,
    },
    harvests: harvests.map((harvest) => ({
      id: harvest.id,
      label: `${harvest.komoditas} (${harvest.lokasi})`,
      commodity: harvest.komoditas,
      commodity_name: harvest.komoditas,
      perishability_class: harvest.kelas,
      shelf_life_hours: harvest.shelfLife,
      hours_since_harvest: harvest.jamSejakPanen,
      price_per_kg: harvest.nilaiPerKg,
      quantity_kg: harvest.volume,
      location: { lat: harvest.lat, lng: harvest.lng, name: harvest.lokasi },
      harvest_timestamp: new Date(Date.now() - harvest.jamSejakPanen * 3600 * 1000).toISOString(),
      initial_condition: "fresh",
      handling_factor: HANDLING_FACTOR[harvest.kelas] ?? 1,
    })),
    vehicles: [
      {
        id: "v-l300",
        name: VEHICLE.nama,
        location: {
          lat: VEHICLE.poolCoord[0],
          lng: VEHICLE.poolCoord[1],
          name: VEHICLE.pool,
        },
        capacity_kg: VEHICLE.kapasitas,
        available: true,
        cost_per_km_idr: 5000,
      },
    ],
    mode: "spoilage_priority" as const,
  };
}
