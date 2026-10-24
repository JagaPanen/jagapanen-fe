/** Browser storage for JagaPanen JWT (user or guest). */

const TOKEN_KEY = "jagapanen_access_token";
const META_KEY = "jagapanen_auth_meta";

export type AuthRole = "user" | "guest";

export interface AuthMeta {
  role: AuthRole;
  orgId: string;
  scenarioId?: string | null;
  runsUsed?: number | null;
  runsRemaining?: number | null;
  email?: string | null;
  expiresAt?: string | null;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getAuthMeta(): AuthMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthMeta;
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, meta: AuthMeta): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(META_KEY);
  } catch {
    // ignore
  }
}

export function isGuestSession(): boolean {
  return getAuthMeta()?.role === "guest";
}
