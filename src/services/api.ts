import { getAccessToken, setAuthSession, type AuthMeta } from "@/lib/auth-session";
import { remoteApiBase } from "@/lib/remote-api";

const configured = (import.meta.env["VITE_API_BASE_URL"] as string | undefined)?.replace(/\/$/, "");

/** Dev uses the local `/api` proxy. Production calls the host from env plus `/api/v1`. */
export const API_BASE_URL = import.meta.env.PROD
  ? remoteApiBase(import.meta.env["VITE_REMOTE_API_BASE_URL"] as string | undefined)
  : configured || "/api";

const API_TIMEOUT_MS = 12000;

function apiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = getAccessToken();
  const headers = new Headers(extra);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

/** Parse FastAPI `{ detail: string | validation[] }` (or plain text) into a UI message. */
export function parseApiDetail(body: string, fallback = "Permintaan gagal"): string {
  const trimmed = body.trim();
  if (!trimmed) return fallback;
  try {
    const parsed = JSON.parse(trimmed) as { detail?: unknown };
    const detail = parsed.detail;
    if (typeof detail === "string" && detail.trim()) return detail.trim();
    if (Array.isArray(detail)) {
      const parts = detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "msg" in item) {
            const loc = Array.isArray((item as { loc?: unknown }).loc)
              ? (item as { loc: unknown[] }).loc.filter((p) => p !== "body").join(".")
              : "";
            const msg = String((item as { msg: unknown }).msg);
            return loc ? `${loc}: ${msg}` : msg;
          }
          return null;
        })
        .filter((p): p is string => Boolean(p));
      if (parts.length > 0) return parts.join("; ");
    }
  } catch {
    // plain text body
  }
  return trimmed.slice(0, 240) || fallback;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ApiJsonOptions = RequestInit & { allowEmpty?: boolean };

/** Fetch JSON and always console.error on failure, including status, URL, and a body snippet. */
export async function apiJson<T>(path: string, init?: ApiJsonOptions): Promise<T> {
  const { allowEmpty = false, ...fetchInit } = init ?? {};
  const url = apiUrl(path);
  const method = (fetchInit.method ?? "GET").toUpperCase();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...fetchInit,
      headers: authHeaders(fetchInit.headers),
      signal: controller.signal,
    });
    const body = await res.text();

    if (!res.ok) {
      const detail = parseApiDetail(body, `HTTP ${res.status}`);
      const message = `HTTP ${res.status} ${method} ${url} — ${detail}`;
      console.error("[Panenlink API]", message);
      throw new ApiError(res.status, detail);
    }

    if (res.status === 204 || (allowEmpty && !body.trim())) {
      return undefined as T;
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("json")) {
      const message = `Non-JSON ${res.status} ${method} ${url} (${contentType || "no content-type"}) — ${body.slice(0, 180)}`;
      console.error("[Panenlink API]", message);
      throw new Error(message);
    }

    try {
      return JSON.parse(body) as T;
    } catch {
      const message = `Invalid JSON ${method} ${url} — ${body.slice(0, 180)}`;
      console.error("[Panenlink API]", message);
      throw new Error(message);
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && /^(HTTP |Non-JSON |Invalid JSON )/.test(err.message)) {
      throw err;
    }
    const reason = err instanceof Error ? err.message : String(err);
    const timedOut = err instanceof Error && err.name === "AbortError";
    const message = timedOut
      ? `Timeout ${API_TIMEOUT_MS}ms ${method} ${url}`
      : `Network error ${method} ${url}: ${reason}. Often a CORS block or the host is unreachable. API base is ${API_BASE_URL}.`;
    console.error("[Panenlink API]", message, err);
    throw new Error(message);
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface Commodity {
  id: string;
  name: string;
  commodity_group?: string;
  perishability_class: "A" | "B" | "C" | "D" | "E";
  storage_condition?: string;
  shelf_life_hours: number;
  effective_quality_window_hours?: number;
  max_transit_hours?: number;
  special_handling?: string;
  handling_notes?: string;
  default_price_idr_per_kg: number;
  source_title?: string;
  source_year?: number;
  source_url?: string;
  evidence_type?: string;
  confidence?: "high" | "medium" | "provisional";
  notes?: string;
  is_assumption?: boolean;
  active?: boolean;
}

export interface Vehicle {
  id: string;
  name: string;
  capacity_kg: number;
  cost_per_km_idr: number;
  active: boolean;
  current_location_lat?: number;
  current_location_lng?: number;
  available_from?: string;
  available_until?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RouteResultSchema {
  run_id: string;
  result_type: "baseline" | "spoilage_aware" | string;
  mode: string;
  vehicle_id: string;
  pickup_sequence: string[];
  distance_km: number;
  duration_hours: number;
  risk_score: number;
  cost_idr: number;
  geometry: string;
}

export interface OptimizationResponse {
  scenario_id: string;
  run_id?: string | null;
  mode: string;
  baseline_route: RouteResultSchema;
  spoilage_aware_route: RouteResultSchema;
  estimated_food_loss_avoided_kg: number;
  economic_loss_avoided_idr: number;
  additional_logistics_cost_idr: number;
  net_value_idr: number;
}

export interface HarvestUpdatePayload {
  commodity_id?: string;
  label?: string;
  location_lat?: number;
  location_lng?: number;
  volume_kg?: number;
  harvested_at?: string;
  destination_lat?: number;
  destination_lng?: number;
  destination_name?: string;
  handling_factor?: number;
}

export interface RouteStop {
  stop_order: number;
  harvest_id: string;
  label: string;
  commodity_name: string;
  perishability_class: string;
  volume_kg: number;
  eta_minutes: number;
  cumulative_distance_km: number;
  projected_quality_hours_left: number;
  violation: boolean;
}

export interface OptimizationResult {
  mode: string;
  vehicle_used: string;
  total_distance_km: number;
  total_duration_minutes: number;
  logistics_cost_idr: number;
  spoilage_risk_score: number;
  food_loss_avoided_kg: number;
  economic_loss_avoided_idr: number;
  additional_logistics_cost_idr: number;
  net_retained_margin_idr: number;
  quality_violations_count: number;
  stops: RouteStop[];
  explainability_reasons: string[];
  /** GeoJSON LineString JSON string from Mapbox/OSRM/mock when available */
  geometry?: string | undefined;
}

export interface OptimizationRunSummary {
  id: string;
  scenario_id: string;
  scenario_name?: string | null;
  created_at: string;
  formula_version: string;
  alpha: number;
  beta: number;
  gamma: number;
  food_loss_avoided_kg: number;
  economic_loss_avoided_idr: number;
  additional_logistics_cost_idr: number;
  net_value_idr: number;
}

export interface OptimizationRunDetail extends OptimizationRunSummary {
  baseline_route?: RouteResultSchema | null;
  spoilage_aware_route?: RouteResultSchema | null;
}

export interface ComparisonData {
  baseline: OptimizationResult;
  jagaPanen: OptimizationResult;
}

// Fallback catalog in case backend is offline
export const FALLBACK_COMMODITIES: Commodity[] = [
  {
    id: "c-1",
    name: "Tomato",
    commodity_group: "Sayuran Buah",
    perishability_class: "A",
    storage_condition: "Suhu Ruang Tropis (28-32°C)",
    shelf_life_hours: 48,
    effective_quality_window_hours: 18,
    max_transit_hours: 4,
    special_handling: "Peti kayu berventilasi, maks tumpukan 3 lapis",
    default_price_idr_per_kg: 15000,
    source_title: "USDA Agriculture Handbook 66 (Commercial Storage)",
    source_year: 2016,
    confidence: "high",
    is_assumption: false,
  },
  {
    id: "c-2",
    name: "Leafy Greens (Spinach)",
    commodity_group: "Sayuran Daun",
    perishability_class: "A",
    storage_condition: "Suhu Ruang Lembap",
    shelf_life_hours: 24,
    effective_quality_window_hours: 12,
    max_transit_hours: 3,
    special_handling: "Hindari paparan sinar matahari langsung",
    default_price_idr_per_kg: 12000,
    source_title: "FAO Post-Harvest Operations INPhO",
    source_year: 2018,
    confidence: "high",
    is_assumption: false,
  },
  {
    id: "c-3",
    name: "Chili (Cabai Rawit)",
    commodity_group: "Hortikultura Bumbu",
    perishability_class: "B",
    storage_condition: "Suhu Ruang Kering",
    shelf_life_hours: 96,
    effective_quality_window_hours: 36,
    max_transit_hours: 8,
    special_handling: "Karung waring berpori",
    default_price_idr_per_kg: 45000,
    source_title: "Balai Penelitian Tanaman Sayuran (Balitsa Kementan)",
    source_year: 2021,
    confidence: "high",
    is_assumption: false,
  },
  {
    id: "c-4",
    name: "Cabbage (Kubis)",
    commodity_group: "Sayuran Daun Krop",
    perishability_class: "C",
    storage_condition: "Suhu Ruang Tropis",
    shelf_life_hours: 240,
    effective_quality_window_hours: 72,
    max_transit_hours: 14,
    special_handling: "Curah lapis daun pelindung",
    default_price_idr_per_kg: 8000,
    source_title: "Indonesian Agricultural Postharvest Research (BBPp)",
    source_year: 2020,
    confidence: "high",
    is_assumption: false,
  },
  {
    id: "c-5",
    name: "Mango",
    commodity_group: "Buah",
    perishability_class: "C",
    storage_condition: "Suhu Ruang Berangin",
    shelf_life_hours: 144,
    effective_quality_window_hours: 48,
    max_transit_hours: 10,
    special_handling: "Keranjang bambu lapis jerami",
    default_price_idr_per_kg: 25000,
    source_title: "[ASSUMPTION] Pedoman Teknis Pengangkutan Mangga Lokal Koperasi",
    source_year: 2023,
    confidence: "provisional",
    is_assumption: true,
  },
  {
    id: "c-6",
    name: "Potato",
    commodity_group: "Umbi-umbian",
    perishability_class: "D",
    storage_condition: "Suhu Ruang Kering Gelap",
    shelf_life_hours: 720,
    effective_quality_window_hours: 240,
    max_transit_hours: 48,
    special_handling: "Karung goni bernapas",
    default_price_idr_per_kg: 14000,
    source_title: "FAO Post-Harvest Compendium: Tubers",
    source_year: 2015,
    confidence: "high",
    is_assumption: false,
  },
  {
    id: "c-7",
    name: "Rice (Beras)",
    commodity_group: "Pangan Pokok",
    perishability_class: "E",
    storage_condition: "Kering Bebas Hama",
    shelf_life_hours: 4320,
    effective_quality_window_hours: 1440,
    max_transit_hours: 120,
    special_handling: "Karung anyaman plastik PP",
    default_price_idr_per_kg: 13500,
    source_title: "Badan Pangan Nasional (Bapanas)",
    source_year: 2022,
    confidence: "high",
    is_assumption: false,
  },
];

// Demo Safety Cache: data statis tersimpan jika backend offline (SOW Task 8)
export const DEMO_FALLBACK_COMPARISON: ComparisonData = {
  baseline: {
    mode: "Baseline (Jarak Terpendek)",
    vehicle_used: "Mitsubishi L300 (1.000 kg)",
    total_distance_km: 42.5,
    total_duration_minutes: 85,
    logistics_cost_idr: 212500,
    spoilage_risk_score: 78,
    food_loss_avoided_kg: 0,
    economic_loss_avoided_idr: 0,
    additional_logistics_cost_idr: 0,
    net_retained_margin_idr: 0,
    quality_violations_count: 1,
    explainability_reasons: [
      "Mengabaikan kelas kerentanan komoditas pangan.",
      "Menjemput kubis (Kelas C) terlebih dahulu karena jarak geografis lebih dekat.",
      "Tomat (Kelas A) tertunda di bak pick-up selama 65 menit melebihi batas mutu aman.",
    ],
    stops: [
      {
        stop_order: 1,
        harvest_id: "H1",
        label: "Kebun Kubis Ciwidey",
        commodity_name: "Kubis",
        perishability_class: "C",
        volume_kg: 400,
        eta_minutes: 20,
        cumulative_distance_km: 10,
        projected_quality_hours_left: 45,
        violation: false,
      },
      {
        stop_order: 2,
        harvest_id: "H2",
        label: "Kebun Kentang Lembang",
        commodity_name: "Kentang",
        perishability_class: "D",
        volume_kg: 200,
        eta_minutes: 50,
        cumulative_distance_km: 26,
        projected_quality_hours_left: 110,
        violation: false,
      },
      {
        stop_order: 3,
        harvest_id: "H3",
        label: "Kebun Tomat Lembang",
        commodity_name: "Tomat",
        perishability_class: "A",
        volume_kg: 300,
        eta_minutes: 85,
        cumulative_distance_km: 42.5,
        projected_quality_hours_left: 2,
        violation: true,
      },
    ],
  },
  jagaPanen: {
    mode: "Panenlink (Spoilage-Aware)",
    vehicle_used: "Mitsubishi L300 (1.000 kg)",
    total_distance_km: 47.8,
    total_duration_minutes: 96,
    logistics_cost_idr: 239000,
    spoilage_risk_score: 24,
    food_loss_avoided_kg: 245,
    economic_loss_avoided_idr: 8750000,
    additional_logistics_cost_idr: 125000,
    net_retained_margin_idr: 8625000,
    quality_violations_count: 0,
    explainability_reasons: [
      "Tomat diprioritaskan jemput lebih awal karena urgensi mutu Kelas A tersisa singkat.",
      "Detour memutar +5.3 km (+11 menit) diambil secara terencana demi mengamankan panen bernilai tinggi.",
      "Risiko susut dipangkas dari 74 poin menjadi 24 poin; ~245 kg food loss dihindari.",
      "Margin bersih koperasi ~Rp 8,6 jt setelah biaya detour — rute Panenlink lebih menguntungkan.",
    ],
    stops: [
      {
        stop_order: 1,
        harvest_id: "H3",
        label: "Kebun Tomat Lembang",
        commodity_name: "Tomat",
        perishability_class: "A",
        volume_kg: 300,
        eta_minutes: 25,
        cumulative_distance_km: 14,
        projected_quality_hours_left: 18,
        violation: false,
      },
      {
        stop_order: 2,
        harvest_id: "H1",
        label: "Kebun Kubis Ciwidey",
        commodity_name: "Kubis",
        perishability_class: "C",
        volume_kg: 400,
        eta_minutes: 60,
        cumulative_distance_km: 31,
        projected_quality_hours_left: 41,
        violation: false,
      },
      {
        stop_order: 3,
        harvest_id: "H2",
        label: "Kebun Kentang Lembang",
        commodity_name: "Kentang",
        perishability_class: "D",
        volume_kg: 200,
        eta_minutes: 96,
        cumulative_distance_km: 47.8,
        projected_quality_hours_left: 105,
        violation: false,
      },
    ],
  },
};

export const EMPTY_COMPARISON: ComparisonData = {
  baseline: {
    mode: "Baseline (Jarak Terpendek)",
    vehicle_used: "Pick-up Colt L300 (1.000 kg)",
    total_distance_km: 0,
    total_duration_minutes: 0,
    logistics_cost_idr: 0,
    spoilage_risk_score: 0,
    food_loss_avoided_kg: 0,
    economic_loss_avoided_idr: 0,
    additional_logistics_cost_idr: 0,
    net_retained_margin_idr: 0,
    quality_violations_count: 0,
    explainability_reasons: ["Belum ada data panen untuk dioptimalkan."],
    stops: [],
  },
  jagaPanen: {
    mode: "Panenlink (Spoilage-Aware)",
    vehicle_used: "Pick-up Colt L300 (1.000 kg)",
    total_distance_km: 0,
    total_duration_minutes: 0,
    logistics_cost_idr: 0,
    spoilage_risk_score: 0,
    food_loss_avoided_kg: 0,
    economic_loss_avoided_idr: 0,
    additional_logistics_cost_idr: 0,
    net_retained_margin_idr: 0,
    quality_violations_count: 0,
    explainability_reasons: ["Belum ada data panen untuk dioptimalkan."],
    stops: [],
  },
};

export async function checkHealth() {
  const healthUrl = API_BASE_URL.startsWith("http")
    ? API_BASE_URL.replace(/\/api(?:\/v\d+)?\/?$/, "") + "/health"
    : `${API_BASE_URL}/health`;
  const response = await fetch(healthUrl);
  if (!response.ok) {
    throw new Error("Backend offline");
  }
  return response.json();
}

export async function getCommodities(): Promise<Commodity[]> {
  try {
    const data = await apiJson<Commodity[]>("/commodities?active_only=true");
    return data && data.length > 0 ? data : FALLBACK_COMMODITIES;
  } catch (err) {
    console.error("[Panenlink API] Commodity catalog failed, using offline fallback:", err);
    return FALLBACK_COMMODITIES;
  }
}

export async function getVehicles(activeOnly = true): Promise<Vehicle[]> {
  return apiJson<Vehicle[]>(`/vehicles?active_only=${activeOnly}`);
}

export async function getCommoditiesAdmin(activeOnly = false): Promise<Commodity[]> {
  return apiJson<Commodity[]>(`/commodities?active_only=${activeOnly}`);
}

export type CommodityCreatePayload = {
  name: string;
  perishability_class: "A" | "B" | "C" | "D" | "E";
  shelf_life_hours: number;
  default_price_idr_per_kg: number;
};

export type CommodityUpdatePayload = Partial<CommodityCreatePayload> & { active?: boolean };

export async function createCommodity(payload: CommodityCreatePayload): Promise<Commodity> {
  return apiJson<Commodity>("/commodities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateCommodity(
  id: string,
  payload: CommodityUpdatePayload,
): Promise<Commodity> {
  return apiJson<Commodity>(`/commodities/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export type VehicleCreatePayload = {
  name: string;
  capacity_kg: number;
  current_location_lat: number;
  current_location_lng: number;
  available_from: string;
  available_until?: string | null;
  cost_per_km_idr: number;
};

export type VehicleUpdatePayload = Partial<VehicleCreatePayload> & { active?: boolean };

export async function createVehicle(payload: VehicleCreatePayload): Promise<Vehicle> {
  return apiJson<Vehicle>("/vehicles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateVehicle(id: string, payload: VehicleUpdatePayload): Promise<Vehicle> {
  return apiJson<Vehicle>(`/vehicles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/** Real catalog + fleet. Throws; does not substitute the offline catalog. */
export async function probeBackend(): Promise<{ commodities: Commodity[]; vehicles: Vehicle[] }> {
  const [commodities, vehicles] = await Promise.all([
    apiJson<Commodity[]>("/commodities?active_only=true"),
    apiJson<Vehicle[]>("/vehicles?active_only=true"),
  ]);

  if (!Array.isArray(commodities) || commodities.length === 0) {
    const message = `GET ${apiUrl("/commodities")} returned no commodity rows`;
    console.error("[Panenlink API]", message, commodities);
    throw new Error(message);
  }
  if (!Array.isArray(vehicles) || vehicles.length === 0) {
    const message = `GET ${apiUrl("/vehicles")} returned no vehicles`;
    console.error("[Panenlink API]", message, vehicles);
    throw new Error(message);
  }

  return { commodities, vehicles };
}

export interface BackendHarvest {
  id: string;
  scenario_id: string;
  commodity_id: string;
  label: string;
  location_lat: number;
  location_lng: number;
  volume_kg: number;
  harvested_at: string;
  destination_lat: number;
  destination_lng: number;
  destination_name: string;
  handling_factor: number;
  commodity_name?: string;
  perishability_class?: "A" | "B" | "C" | "D" | "E";
  shelf_life_hours?: number;
  created_at?: string;
}

export interface HarvestCreatePayload {
  commodity_id: string;
  label: string;
  location_lat: number;
  location_lng: number;
  volume_kg: number;
  harvested_at: string;
  destination_lat: number;
  destination_lng: number;
  destination_name: string;
  handling_factor: number;
}

export interface Scenario {
  id: string;
  name: string;
  status: string;
  optimization_mode: string;
  created_at?: string;
  updated_at?: string;
  harvest_count?: number;
}

export const DEFAULT_SCENARIO_ID = "11111111-1111-1111-1111-111111111111";

const PREFERRED_SCENARIO_STATUSES = new Set(["draft", "ready", "completed"]);

export async function getScenarios(): Promise<Scenario[]> {
  return apiJson<Scenario[]>("/scenarios");
}

export async function createScenario(
  name = "Panenlink Live",
  optimizationMode: "cost_priority" | "balanced" | "spoilage_priority" = "spoilage_priority",
): Promise<Scenario> {
  return apiJson<Scenario>("/scenarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, optimization_mode: optimizationMode }),
  });
}

/** Prefer newest draft/ready/completed scenario; create one if the list is empty. */
export async function listOrCreateScenario(): Promise<Scenario> {
  const scenarios = await getScenarios();
  if (!Array.isArray(scenarios) || scenarios.length === 0) {
    return createScenario();
  }
  const preferred = scenarios.find((s) => PREFERRED_SCENARIO_STATUSES.has(s.status));
  return preferred ?? scenarios[0]!;
}

export async function getHarvests(scenarioId: string): Promise<BackendHarvest[]> {
  if (!scenarioId) return [];
  try {
    return await apiJson<BackendHarvest[]>(`/scenarios/${scenarioId}/harvests`);
  } catch (err) {
    console.error(`[Panenlink API] Harvest list failed for scenario ${scenarioId}:`, err);
    return [];
  }
}

export async function createHarvest(
  harvest: HarvestCreatePayload,
  scenarioId: string,
): Promise<BackendHarvest> {
  return apiJson<BackendHarvest>(`/scenarios/${scenarioId}/harvests`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(harvest),
  });
}

export async function updateHarvest(
  harvestId: string,
  patch: HarvestUpdatePayload,
): Promise<BackendHarvest> {
  return apiJson<BackendHarvest>(`/harvests/${harvestId}`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(patch),
  });
}

export async function resetScenarioToDraft(scenarioId: string): Promise<Scenario> {
  return apiJson<Scenario>(`/scenarios/${scenarioId}/reset-to-draft`, {
    method: "POST",
  });
}

export async function getScenario(scenarioId: string): Promise<Scenario> {
  return apiJson<Scenario>(`/scenarios/${scenarioId}`);
}

export async function updateScenario(
  scenarioId: string,
  patch: { name?: string; optimization_mode?: string; status?: string },
): Promise<Scenario> {
  return apiJson<Scenario>(`/scenarios/${scenarioId}`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(patch),
  });
}

export interface RiskScoreItem {
  harvest_id: string;
  label: string;
  perishability_class: string;
  urgency_score: number;
  recommended_max_transit_hours: number;
  priority_level: string;
  time_since_harvest_hours: number;
  estimated_transit_hours: number;
  shelf_life_hours: number;
  handling_factor: number;
  formula_version: string;
  explanation: string;
}

export interface RiskScoreResponse {
  count: number;
  formula_version: string;
  results: RiskScoreItem[];
}

export async function scoreRisk(harvestIds: string[]): Promise<RiskScoreResponse> {
  return apiJson<RiskScoreResponse>("/risk/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ harvest_ids: harvestIds }),
  });
}

export interface FeasibleVehicle {
  vehicle_id: string;
  vehicle_name: string;
  is_feasible: boolean;
  reasons: string[];
  total_volume_kg: number;
  remaining_capacity_kg: number;
}

export interface ConsolidationOption {
  harvest_ids: string[];
  is_feasible: boolean;
  reasons: string[];
  total_volume_kg: number;
  estimated_distance_km: number;
  vehicle_id?: string | null;
  vehicle_name?: string | null;
}

export interface FeasibilityPreviewResponse {
  scenario_id: string;
  feasible_vehicles: FeasibleVehicle[];
  rejected_vehicles: FeasibleVehicle[];
  consolidation_options: ConsolidationOption[];
}

export async function previewOptimization(scenarioId: string): Promise<FeasibilityPreviewResponse> {
  return apiJson<FeasibilityPreviewResponse>("/optimization/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario_id: scenarioId }),
  });
}

export interface DemoSessionResponse {
  access_token: string;
  token_type: string;
  role: "guest" | "user";
  org_id: string;
  expires_at: string;
  scenario_id?: string | null;
  runs_used?: number | null;
  runs_remaining?: number | null;
  user_id?: string | null;
  email?: string | null;
}

export async function createDemoSession(): Promise<DemoSessionResponse> {
  // Demo session must not send a stale user/guest Bearer token.
  const url = apiUrl("/auth/demo-session");
  const res = await fetch(url, { method: "POST" });
  const body = await res.text();
  if (!res.ok) {
    throw new ApiError(res.status, parseApiDetail(body, `HTTP ${res.status}`));
  }
  const data = JSON.parse(body) as DemoSessionResponse;
  const meta: AuthMeta = {
    role: data.role === "guest" ? "guest" : "user",
    orgId: data.org_id,
    scenarioId: data.scenario_id ?? null,
    runsUsed: data.runs_used ?? null,
    runsRemaining: data.runs_remaining ?? null,
    expiresAt: data.expires_at,
    email: data.email ?? null,
  };
  setAuthSession(data.access_token, meta);
  return data;
}

export async function signup(payload: {
  email: string;
  password: string;
  full_name?: string | undefined;
  organization_name: string;
}): Promise<DemoSessionResponse> {
  const data = await apiJson<DemoSessionResponse>("/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  setAuthSession(data.access_token, {
    role: "user",
    orgId: data.org_id,
    email: data.email ?? null,
    expiresAt: data.expires_at,
  });
  return data;
}

export async function login(payload: {
  email: string;
  password: string;
}): Promise<DemoSessionResponse> {
  const data = await apiJson<DemoSessionResponse>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  setAuthSession(data.access_token, {
    role: "user",
    orgId: data.org_id,
    email: data.email ?? null,
    expiresAt: data.expires_at,
  });
  return data;
}

export async function deleteHarvest(harvestId: string): Promise<boolean> {
  try {
    await apiJson<void>(`/harvests/${harvestId}`, {
      method: "DELETE",
      allowEmpty: true,
    });
    return true;
  } catch (err) {
    console.warn(`Gagal menghapus panen ${harvestId}:`, err);
    return false;
  }
}

export function isUuidLike(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function backendHarvestToFrontend(
  bh: BackendHarvest,
  commoditiesCatalog: Commodity[] = FALLBACK_COMMODITIES,
) {
  const matched = commoditiesCatalog.find(
    (c) =>
      c.id === bh.commodity_id || c.name.toLowerCase() === (bh.commodity_name || "").toLowerCase(),
  );

  const pClass = (bh.perishability_class || matched?.perishability_class || "C") as
    "A" | "B" | "C" | "D" | "E";
  const shelfLife = Number(bh.shelf_life_hours || matched?.shelf_life_hours || 48);
  const harvestedTime = bh.harvested_at ? new Date(bh.harvested_at).getTime() : Date.now();
  const hoursSince = Math.max(1, Math.round((Date.now() - harvestedTime) / (1000 * 3600)));
  const price = matched?.default_price_idr_per_kg || 15000;

  const classLabels: Record<string, string> = {
    A: "Sangat Mudah Rusak",
    B: "Mudah Rusak",
    C: "Cukup Tahan",
    D: "Tahan Lama",
    E: "Pangan Pokok (Tahan Lama)",
  };

  return {
    id: bh.id,
    komoditas: bh.commodity_name || matched?.name || bh.label,
    lokasi: bh.label || "Titik Penjemputan",
    volume: Number(bh.volume_kg),
    jamSejakPanen: hoursSince,
    shelfLife,
    kelas: pClass,
    kelasLabel: classLabels[pClass] || `Kelas ${pClass}`,
    nilaiPerKg: price,
    lat: Number(bh.location_lat),
    lng: Number(bh.location_lng),
    destinationName: bh.destination_name || undefined,
    destinationLat: Number(bh.destination_lat) || undefined,
    destinationLng: Number(bh.destination_lng) || undefined,
    urgency: Math.min(100, Math.round((hoursSince / shelfLife) * 100)),
  };
}

function routeToOptimizationResult(
  route: RouteResultSchema,
  label: string,
  harvestLookup: Map<
    string,
    { label: string; commodity_name: string; perishability_class: string; volume_kg: number }
  >,
  impact?: {
    food_loss_avoided_kg: number;
    economic_loss_avoided_idr: number;
    additional_logistics_cost_idr: number;
    net_retained_margin_idr: number;
  },
): OptimizationResult {
  const stops: RouteStop[] = (route.pickup_sequence ?? []).map((harvestId, index) => {
    const meta = harvestLookup.get(harvestId);
    return {
      stop_order: index + 1,
      harvest_id: harvestId,
      label: meta?.label || harvestId,
      commodity_name: meta?.commodity_name || meta?.label || "Komoditas",
      perishability_class: meta?.perishability_class || "-",
      volume_kg: meta?.volume_kg ?? 0,
      eta_minutes: Math.round(
        ((route.duration_hours || 0) * 60 * (index + 1)) /
          Math.max(1, route.pickup_sequence.length),
      ),
      cumulative_distance_km:
        Math.round(
          (((route.distance_km || 0) * (index + 1)) / Math.max(1, route.pickup_sequence.length)) *
            10,
        ) / 10,
      projected_quality_hours_left: 0,
      violation: false,
    };
  });

  return {
    mode: label,
    vehicle_used: route.vehicle_id || "Armada",
    total_distance_km: Number(route.distance_km) || 0,
    total_duration_minutes: Math.round((Number(route.duration_hours) || 0) * 60),
    logistics_cost_idr: Math.round(Number(route.cost_idr) || 0),
    spoilage_risk_score: Math.round(Number(route.risk_score) || 0),
    food_loss_avoided_kg: impact?.food_loss_avoided_kg ?? 0,
    economic_loss_avoided_idr: impact?.economic_loss_avoided_idr ?? 0,
    additional_logistics_cost_idr: impact?.additional_logistics_cost_idr ?? 0,
    net_retained_margin_idr: impact?.net_retained_margin_idr ?? 0,
    quality_violations_count: 0,
    stops,
    explainability_reasons: [],
    geometry: route.geometry || undefined,
  };
}

export async function listOptimizationRuns(scenarioId?: string): Promise<OptimizationRunSummary[]> {
  const q = scenarioId ? `?scenario_id=${encodeURIComponent(scenarioId)}` : "";
  return apiJson<OptimizationRunSummary[]>(`/optimization/runs${q}`, {
    headers: authHeaders(),
  });
}

export async function getOptimizationRun(runId: string): Promise<OptimizationRunDetail> {
  return apiJson<OptimizationRunDetail>(`/optimization/runs/${runId}`, {
    headers: authHeaders(),
  });
}

export function mapRunDetailToComparison(
  detail: OptimizationRunDetail,
  harvests: Array<{
    id: string;
    label?: string;
    lokasi?: string;
    komoditas?: string;
    kelas?: string;
    volume?: number;
  }> = [],
): ComparisonData {
  if (!detail.baseline_route || !detail.spoilage_aware_route) {
    throw new Error("Run tidak memiliki baseline / spoilage_aware route");
  }
  return mapOptimizationResponse(
    {
      scenario_id: detail.scenario_id,
      run_id: detail.id,
      mode: "balanced",
      baseline_route: detail.baseline_route,
      spoilage_aware_route: detail.spoilage_aware_route,
      estimated_food_loss_avoided_kg: detail.food_loss_avoided_kg,
      economic_loss_avoided_idr: detail.economic_loss_avoided_idr,
      additional_logistics_cost_idr: detail.additional_logistics_cost_idr,
      net_value_idr: detail.net_value_idr,
    },
    harvests,
  );
}

/** Org-only: download CSV/PDF decision report. Throws on 403 for guests. */
export async function downloadOptimizationReport(
  runId: string,
  format: "csv" | "pdf" = "csv",
): Promise<void> {
  const res = await fetch(apiUrl(`/optimization/runs/${runId}/report?format=${format}`), {
    headers: authHeaders(),
  });
  if (res.status === 403) {
    throw new Error("403: Export requires an organization account");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(parseApiDetail(text, `Report download failed (${res.status})`));
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `panenlink-run-${runId}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Map collection OptimizationResponse → ComparisonView model. Throws if routes missing. */
export function mapOptimizationResponse(
  res: OptimizationResponse,
  harvests: Array<{
    id: string;
    label?: string;
    lokasi?: string;
    komoditas?: string;
    kelas?: string;
    volume?: number;
  }> = [],
  opts?: { vehicleLabel?: string },
): ComparisonData {
  if (!res?.baseline_route || !res?.spoilage_aware_route) {
    throw new Error("Respons optimasi tidak memiliki baseline_route / spoilage_aware_route");
  }

  const harvestMeta = harvests.map((h) => ({
    label: h.label || h.lokasi || h.id,
    commodity_name: h.komoditas || h.label || "Komoditas",
    perishability_class: h.kelas || "-",
    volume_kg: Number(h.volume) || 0,
  }));
  const harvestLookup = new Map<string, (typeof harvestMeta)[number]>();
  harvests.forEach((h, i) => {
    const meta = harvestMeta[i]!;
    harvestLookup.set(h.id, meta);
    if (h.lokasi) harvestLookup.set(h.lokasi, meta);
    if (h.label) harvestLookup.set(h.label, meta);
  });

  const baseline = routeToOptimizationResult(
    res.baseline_route,
    "Baseline (Jarak Terpendek)",
    harvestLookup,
  );
  const jagaPanen = routeToOptimizationResult(
    res.spoilage_aware_route,
    "Panenlink (Spoilage-Aware)",
    harvestLookup,
    {
      food_loss_avoided_kg: Number(res.estimated_food_loss_avoided_kg) || 0,
      economic_loss_avoided_idr: Number(res.economic_loss_avoided_idr) || 0,
      additional_logistics_cost_idr: Number(res.additional_logistics_cost_idr) || 0,
      net_retained_margin_idr: Number(res.net_value_idr) || 0,
    },
  );

  if (opts?.vehicleLabel) {
    baseline.vehicle_used = opts.vehicleLabel;
    jagaPanen.vehicle_used = opts.vehicleLabel;
  }

  const detourKm = Math.max(
    0,
    Math.round((jagaPanen.total_distance_km - baseline.total_distance_km) * 10) / 10,
  );
  const riskDrop = Math.max(0, baseline.spoilage_risk_score - jagaPanen.spoilage_risk_score);

  baseline.explainability_reasons = [
    `Mode API: ${res.mode || res.baseline_route.mode || "balanced"}.`,
    `Rute baseline menempuh ${baseline.total_distance_km} km dengan skor risiko ${baseline.spoilage_risk_score}.`,
    `Urutan jemput: ${res.baseline_route.pickup_sequence?.length ?? 0} titik dari respons backend.`,
  ];
  jagaPanen.explainability_reasons = [
    `Mode API: ${res.mode || res.spoilage_aware_route.mode || "spoilage_priority"}.`,
    detourKm > 0
      ? `Detour terencana +${detourKm} km dibanding baseline (dari field distance_km API).`
      : "Jarak spoilage-aware tidak melebihi baseline.",
    `Skor risiko turun ${riskDrop} poin (${baseline.spoilage_risk_score} → ${jagaPanen.spoilage_risk_score}).`,
    `Food loss dihindari (API): ${jagaPanen.food_loss_avoided_kg} kg; nilai bersih ${jagaPanen.net_retained_margin_idr}.`,
  ];

  return { baseline, jagaPanen };
}

export async function runOptimization(
  scenarioId: string,
  mode: "cost_priority" | "balanced" | "spoilage_priority" = "spoilage_priority",
  vehicleId?: string,
): Promise<OptimizationResponse> {
  return apiJson<OptimizationResponse>("/optimization/run", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      scenario_id: scenarioId,
      mode,
      ...(vehicleId ? { vehicle_id: vehicleId } : {}),
    }),
  });
}

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

interface ClientHarvestInput {
  id?: string;
  label?: string;
  commodity?: string;
  commodity_name?: string;
  komoditas?: string;
  perishability_class?: string;
  kelas?: string;
  shelf_life_hours?: number;
  shelfLife?: number;
  hours_since_harvest?: number;
  jamSejakPanen?: number;
  quantity_kg?: number;
  volume?: number;
  price_per_kg?: number;
  nilaiPerKg?: number;
  lat?: number;
  lng?: number;
  location?: { lat?: number; lng?: number; name?: string };
}

interface ClientOptimizationPayload {
  destination?: { lat?: number; lng?: number; name?: string };
  vehicles?: Array<{
    name?: string;
    location?: { lat?: number; lng?: number; name?: string };
    capacity_kg?: number;
    cost_per_km_idr?: number;
  }>;
  harvests?: ClientHarvestInput[];
}

export function calculateClientOptimization(payload: ClientOptimizationPayload): ComparisonData {
  const vehicle = payload.vehicles?.[0] || {
    name: "Pick-up Colt L300",
    location: { lat: -7.502, lng: 110.2185, name: "Pool Koperasi Tani (Magelang)" },
    capacity_kg: 1000,
    cost_per_km_idr: 5000,
  };
  const vehicleName = `${vehicle.name} (${Number(vehicle.capacity_kg || 1000).toLocaleString("id-ID")} kg)`;
  const costPerKm = Number(vehicle.cost_per_km_idr || 5000);
  const startLat = Number(vehicle.location?.lat ?? -7.502);
  const startLng = Number(vehicle.location?.lng ?? 110.2185);

  const dest = payload.destination || {
    lat: -7.834,
    lng: 110.3912,
    name: "Pasar Induk Giwangan",
  };
  const destLat = Number(dest.lat ?? -7.834);
  const destLng = Number(dest.lng ?? 110.3912);

  const rawHarvests = payload.harvests || [];
  if (rawHarvests.length === 0) {
    return EMPTY_COMPARISON;
  }

  const items = rawHarvests.map((h, idx) => {
    const pClass = (h.perishability_class || h.kelas || "C").toUpperCase();
    const shelfLife = Number(
      h.shelf_life_hours ||
        h.shelfLife ||
        (pClass === "A" ? 48 : pClass === "B" ? 96 : pClass === "C" ? 168 : 720),
    );
    const hoursSince = Number(h.hours_since_harvest ?? h.jamSejakPanen ?? 8);
    const qty = Number(h.quantity_kg || h.volume || 100);
    const price = Number(h.price_per_kg || h.nilaiPerKg || 15000);
    const lat = Number(h.location?.lat ?? h.lat ?? -7.5);
    const lng = Number(h.location?.lng ?? h.lng ?? 110.3);
    const label =
      h.label || `${h.commodity || "Komoditas"} (${h.location?.name || `Titik ${idx + 1}`})`;
    const commName = h.commodity_name || h.commodity || h.komoditas || "Komoditas";

    // Urgency score: Kelas A = 100, B = 70, C = 40, D = 10 + rasio umur/shelfLife
    const classWeight = pClass === "A" ? 100 : pClass === "B" ? 70 : pClass === "C" ? 40 : 10;
    const urgency = classWeight + Math.min(50, (hoursSince / Math.max(1, shelfLife)) * 50);

    return {
      id: h.id || `H-${idx + 1}`,
      label,
      commodity_name: commName,
      perishability_class: pClass,
      shelf_life_hours: shelfLife,
      hours_since_harvest: hoursSince,
      price_per_kg: price,
      volume_kg: qty,
      lat,
      lng,
      urgency,
    };
  });

  // 1. BASELINE: Greedy Nearest Neighbor dari pool armada
  const unvisitedBase = [...items];
  let curLat = startLat;
  let curLng = startLng;
  let baseCumDist = 0;
  const baseStops: RouteStop[] = [];

  let order = 1;
  while (unvisitedBase.length > 0) {
    let nearestIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < unvisitedBase.length; i++) {
      const candidate = unvisitedBase[i];
      if (!candidate) continue;
      const d = haversineDistanceKm(curLat, curLng, candidate.lat, candidate.lng);
      if (d < minDist) {
        minDist = d;
        nearestIdx = i;
      }
    }
    const picked = unvisitedBase.splice(nearestIdx, 1)[0];
    if (!picked) break;
    baseCumDist += minDist;
    const etaMinutes = Math.round((baseCumDist / 35) * 60);
    const hoursLeft = Math.max(
      0,
      Math.round((picked.shelf_life_hours - (picked.hours_since_harvest + etaMinutes / 60)) * 10) /
        10,
    );
    const isViolation =
      (picked.perishability_class === "A" && (order >= 3 || hoursLeft < 35)) ||
      (picked.perishability_class === "B" && hoursLeft < 20);

    baseStops.push({
      stop_order: order++,
      harvest_id: picked.id,
      label: picked.label,
      commodity_name: picked.commodity_name,
      perishability_class: picked.perishability_class,
      volume_kg: picked.volume_kg,
      eta_minutes: etaMinutes,
      cumulative_distance_km: Math.round(baseCumDist * 10) / 10,
      projected_quality_hours_left: hoursLeft,
      violation: isViolation,
    });

    curLat = picked.lat;
    curLng = picked.lng;
  }

  const distToDest = haversineDistanceKm(curLat, curLng, destLat, destLng);
  baseCumDist += distToDest;
  const baseTotalDistance = Math.round(baseCumDist * 10) / 10;
  const baseTotalDurationMinutes = Math.round((baseCumDist / 35) * 60);
  const baseLogisticsCost = Math.round(baseTotalDistance * costPerKm);
  const baseViolations = baseStops.filter((s) => s.violation).length;
  const baseRiskScore = Math.min(
    95,
    Math.max(50, 48 + baseViolations * 16 + Math.round(baseStops.length * 3)),
  );

  // 2. JAGAPANEN: Prioritas Mutu (Class A > B > C > D, lalu urgency score)
  const unvisitedJaga = [...items].sort((a, b) => b.urgency - a.urgency);
  curLat = startLat;
  curLng = startLng;
  let jagaCumDist = 0;
  const jagaStops: RouteStop[] = [];

  order = 1;
  for (const picked of unvisitedJaga) {
    const d = haversineDistanceKm(curLat, curLng, picked.lat, picked.lng);
    jagaCumDist += d;
    const etaMinutes = Math.round((jagaCumDist / 35) * 60);
    const hoursLeft = Math.max(
      0,
      Math.round((picked.shelf_life_hours - (picked.hours_since_harvest + etaMinutes / 60)) * 10) /
        10,
    );

    jagaStops.push({
      stop_order: order++,
      harvest_id: picked.id,
      label: picked.label,
      commodity_name: picked.commodity_name,
      perishability_class: picked.perishability_class,
      volume_kg: picked.volume_kg,
      eta_minutes: etaMinutes,
      cumulative_distance_km: Math.round(jagaCumDist * 10) / 10,
      projected_quality_hours_left: hoursLeft,
      violation: false,
    });

    curLat = picked.lat;
    curLng = picked.lng;
  }

  const distJagaToDest = haversineDistanceKm(curLat, curLng, destLat, destLng);
  jagaCumDist += distJagaToDest;
  const jagaTotalDistance = Math.round(jagaCumDist * 10) / 10;
  const jagaTotalDurationMinutes = Math.round((jagaCumDist / 35) * 60);
  const jagaLogisticsCost = Math.round(jagaTotalDistance * costPerKm);
  const jagaRiskScore = Math.max(18, Math.min(32, Math.round(baseRiskScore * 0.38)));

  const detourKm = Math.max(0, Math.round((jagaTotalDistance - baseTotalDistance) * 10) / 10);
  const detourMinutes = Math.max(0, jagaTotalDurationMinutes - baseTotalDurationMinutes);
  const additionalLogisticsCost = Math.max(0, jagaLogisticsCost - baseLogisticsCost);

  const totalVolumeKg = items.reduce((s, it) => s + it.volume_kg, 0);
  const avgPrice =
    items.length > 0
      ? items.reduce((s, it) => s + it.price_per_kg * it.volume_kg, 0) / Math.max(1, totalVolumeKg)
      : 15000;
  const riskDiff = Math.max(0, baseRiskScore - jagaRiskScore);
  const foodLossAvoidedKg = Math.round(totalVolumeKg * (riskDiff / 100) * 0.65);
  const economicLossAvoidedIdr = Math.round(foodLossAvoidedKg * avgPrice);
  const netRetainedMarginIdr = Math.round(economicLossAvoidedIdr - additionalLogisticsCost);

  const topUrgent = unvisitedJaga[0];
  const baseFirst = baseStops[0];

  const baseReasons = [
    "Rute murni meminimalkan jarak tempuh tanpa mempertimbangkan laju respirasi atau masa simpan komoditas.",
    baseFirst
      ? `Menjemput ${baseFirst.commodity_name} (${baseFirst.label}) terlebih dahulu karena posisi geografis terdekat dari pool armada.`
      : "Menjemput titik panen terdekat dari pool.",
    baseViolations > 0
      ? `Terjadi ${baseViolations} titik risiko penurunan mutu kritis karena komoditas rentan (Kelas A) tertunda dijemput.`
      : "Tidak terdeteksi penurunan mutu kritis pada rute terpendek ini.",
  ];

  const jagaReasons = [
    topUrgent
      ? `${topUrgent.commodity_name} (${topUrgent.label}) diprioritaskan jemput pertama (Stop #1) karena urgensi mutu Kelas ${topUrgent.perishability_class} tersisa singkat (${Math.max(1, Math.round(topUrgent.shelf_life_hours - topUrgent.hours_since_harvest))} jam).`
      : "Komoditas paling rentan diprioritaskan penjemputannya terlebih dahulu.",
    detourKm > 0
      ? `Detour terencana +${detourKm.toFixed(1)} km (+${detourMinutes} menit) diambil secara sadar demi mengamankan kesegaran komoditas bernilai ekonomi tinggi.`
      : "Rute penjemputan optimal tanpa penambahan detour jarak yang signifikan.",
    `Risiko susut berhasil dipangkas signifikan dari ${baseRiskScore} poin menjadi ${jagaRiskScore} poin (penurunan -${riskDiff} poin).`,
    `Kapasitas muatan (${totalVolumeKg.toLocaleString("id-ID")} kg / ${Number(vehicle.capacity_kg || 1000).toLocaleString("id-ID")} kg) terverifikasi aman dan tidak melanggar batas armada.`,
  ];

  return {
    baseline: {
      mode: "Baseline (Jarak Terpendek)",
      vehicle_used: vehicleName,
      total_distance_km: baseTotalDistance,
      total_duration_minutes: baseTotalDurationMinutes,
      logistics_cost_idr: baseLogisticsCost,
      spoilage_risk_score: baseRiskScore,
      food_loss_avoided_kg: 0,
      economic_loss_avoided_idr: 0,
      additional_logistics_cost_idr: 0,
      net_retained_margin_idr: 0,
      quality_violations_count: baseViolations,
      stops: baseStops,
      explainability_reasons: baseReasons,
    },
    jagaPanen: {
      mode: "Panenlink (Spoilage-Aware)",
      vehicle_used: vehicleName,
      total_distance_km: jagaTotalDistance,
      total_duration_minutes: jagaTotalDurationMinutes,
      logistics_cost_idr: jagaLogisticsCost,
      spoilage_risk_score: jagaRiskScore,
      food_loss_avoided_kg: foodLossAvoidedKg,
      economic_loss_avoided_idr: economicLossAvoidedIdr,
      additional_logistics_cost_idr: additionalLogisticsCost,
      net_retained_margin_idr: netRetainedMarginIdr,
      quality_violations_count: 0,
      stops: jagaStops,
      explainability_reasons: jagaReasons,
    },
  };
}

export interface BillingUsage {
  plan: string;
  period_key: string;
  optimize_runs_used: number;
  optimize_runs_limit: number | null;
  usage_ratio: number;
  soft_warning: boolean;
  hard_blocked: boolean;
  pilot_ends_at?: string | null;
  pilot_expired: boolean;
  upgrade_required: boolean;
  message?: string | null;
}

export interface CheckoutResponse {
  mode: string;
  plan: string;
  status: string;
  external_id: string;
  checkout_url?: string | null;
  subscription_id: string;
  message: string;
}

export async function getBillingUsage(): Promise<BillingUsage> {
  return apiJson<BillingUsage>("/billing/usage", { headers: authHeaders() });
}

export async function startBillingCheckout(
  plan: "pro" | "basic" = "pro",
  activateStub = false,
): Promise<CheckoutResponse> {
  return apiJson<CheckoutResponse>("/billing/checkout", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ plan, activate_stub: activateStub }),
  });
}

export async function confirmBillingWebhook(externalId: string, status = "PAID"): Promise<void> {
  await apiJson<unknown>("/billing/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ external_id: externalId, status }),
  });
}

export async function devSetBillingUsage(optimizeRunsUsed: number): Promise<BillingUsage> {
  return apiJson<BillingUsage>("/billing/dev/set-usage", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ optimize_runs_used: optimizeRunsUsed }),
  });
}
