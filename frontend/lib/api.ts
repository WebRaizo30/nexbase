import { clearAuthToken, getAuthToken } from "./auth";

const FETCH_TIMEOUT_MS = 45_000;

/**
 * Resolves the API base URL for `fetch`.
 * On the live site (non-localhost), if env was missing at build time the bundle still
 * defaults to localhost — browsers block that from https, causing "network error".
 * Same-origin Vercel Services use `/_/backend`.
 */
export function getApiBase(): string {
  const env = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1";

    if (!isLocal) {
      const bakedLocalOnly =
        !env ||
        env === "http://localhost:4000" ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(env);
      if (bakedLocalOnly) {
        return `${window.location.origin}/_/backend`;
      }
    }

    if (env) {
      return env.replace(/\/$/, "");
    }
    return isLocal ? "http://localhost:4000" : `${window.location.origin}/_/backend`;
  }

  if (env) {
    return env.replace(/\/$/, "");
  }
  return "http://localhost:4000";
}

function fetchTimeoutSignal(existing?: AbortSignal | null): AbortSignal | undefined {
  if (typeof AbortSignal === "undefined" || !("timeout" in AbortSignal)) {
    return existing ?? undefined;
  }
  const t = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  if (existing == null) {
    return t;
  }
  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([t, existing]);
  }
  return existing;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(typeof body === "object" && body && "error" in body ? String((body as { error: string }).error) : `HTTP ${status}`);
    this.name = "ApiError";
  }
}

function authHeaders(token: string | null): HeadersInit {
  const h: Record<string, string> = {};
  if (token) {
    h.Authorization = `Bearer ${token}`;
  }
  return h;
}

export async function apiJson<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const useAuth = init.auth !== false;
  const token = useAuth ? getAuthToken() : null;
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  Object.entries(authHeaders(token)).forEach(([k, v]) => headers.set(k, v));

  const url = `${getApiBase()}${path}`;
  const signal = fetchTimeoutSignal(init.signal);

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers,
      ...(signal ? { signal } : {}),
    });
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    if (name === "AbortError") {
      throw new ApiError(0, {
        error:
          "Request timed out or was cancelled. On production, set NEXT_PUBLIC_API_URL in Vercel (e.g. /_/backend for Services).",
      });
    }
    throw new ApiError(0, {
      error:
        "Network error — could not reach the API. Check NEXT_PUBLIC_API_URL and that the backend is deployed.",
    });
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = text;
    }
  }

  if (res.status === 401 && useAuth) {
    clearAuthToken();
  }

  if (!res.ok) {
    throw new ApiError(res.status, data);
  }

  return data as T;
}

export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(authHeaders(token));
  const url = `${getApiBase()}${path}`;
  const signal = fetchTimeoutSignal();

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      body: form,
      headers,
      ...(signal ? { signal } : {}),
    });
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    if (name === "AbortError") {
      throw new ApiError(0, {
        error: "Upload timed out. Check your connection and NEXT_PUBLIC_API_URL.",
      });
    }
    throw new ApiError(0, { error: "Network error during upload." });
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = text;
    }
  }

  if (res.status === 401) {
    clearAuthToken();
  }

  if (!res.ok) {
    throw new ApiError(res.status, data);
  }

  return data as T;
}
