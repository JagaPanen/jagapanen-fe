/** Host only. The route version lives in the app, not in the environment. */
export const DEFAULT_API_ORIGIN = "https://services.panenlink.id";

/** Current backend route prefix. A later version is a change here, not a new base URL. */
export const API_VERSION_v1_PATH = "/api/v1";

export function remoteApiBase(origin: string | undefined): string {
  const host = (origin || DEFAULT_API_ORIGIN).replace(/\/$/, "");
  return `${host}${API_VERSION_v1_PATH}`;
}
