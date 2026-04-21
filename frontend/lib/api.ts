import { clearAuthToken, getAuthToken } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

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

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: form,
    headers,
  });

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

export { API_BASE };
