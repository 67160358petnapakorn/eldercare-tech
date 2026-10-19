export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const ACCESS_TOKEN_KEY = "eldercare_access_token";
const REFRESH_TOKEN_KEY = "eldercare_refresh_token";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("eldercare_token_type");
}

// Only one refresh call in flight at a time, even if several requests 401
// at once — every caller awaits the same promise instead of racing the
// backend with parallel /api/auth/refresh calls. This matters because the
// refresh token is single-use (rotated server-side on every call): a page
// mount fires several apiFetch calls in parallel (layout's /me, summary,
// notifications, plus the page's own data), so with an expired access
// token they all 401 at slightly different times. A caller whose 401
// lands *after* another call already refreshed must not fire a second
// network refresh — it would send the now-already-rotated token and get
// rejected, wiping out the valid tokens the first call just stored.
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(failedAccessToken: string | null): Promise<boolean> {
  // Someone else already refreshed while this request was in flight —
  // the retry will pick up the new token, no need to hit the backend again.
  if (getAccessToken() !== failedAccessToken) return true;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      if (getAccessToken() !== failedAccessToken) return true;
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        setTokens(data.access_token, data.refresh_token);
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

/** Fetch wrapper used by every dashboard page: attaches the access token,
 * and on a 401 tries one silent refresh + retry before giving up and
 * sending the user back to /login. */
export async function apiFetch(path: string, init: RequestInit = {}, allowRetry = true): Promise<any> {
  const token = getAccessToken();
  if (!token) {
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new ApiError("missing-token", 401);
  }

  const headers: Record<string, string> = { ...(init.headers as Record<string, string> | undefined) };
  headers["Authorization"] = `Bearer ${token}`;
  if (init.method && init.method !== "GET" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (response.status === 401 && allowRetry) {
    const refreshed = await tryRefresh(token);
    if (refreshed) {
      return apiFetch(path, init, false);
    }
    clearTokens();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new ApiError("session-expired", 401);
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new ApiError(payload?.detail ?? "request-failed", response.status);
  }

  return response.json().catch(() => ({}));
}

/** Uploads an image file and returns its URL. Deliberately bypasses
 * apiFetch's JSON-body assumption — multipart/form-data needs the browser
 * to set its own Content-Type with a boundary, so we only attach the
 * Authorization header here. */
export async function uploadPhoto(file: File): Promise<{ url: string }> {
  const token = getAccessToken();
  if (!token) {
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new ApiError("missing-token", 401);
  }

  const formData = new FormData();
  formData.append("file", file);

  let response = await fetch(`${API_BASE_URL}/api/uploads/photo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (response.status === 401) {
    const refreshed = await tryRefresh(token);
    if (refreshed) {
      const retryToken = getAccessToken();
      response = await fetch(`${API_BASE_URL}/api/uploads/photo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${retryToken}` },
        body: formData,
      });
    }
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new ApiError(payload?.detail ?? "upload-failed", response.status);
  }

  return response.json();
}

export async function logoutRequest() {
  const refreshToken = getRefreshToken();
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    // best-effort — clearing local tokens below is what actually logs the user out
  }
  clearTokens();
}
