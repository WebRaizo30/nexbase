const TOKEN_STORAGE_KEY = "nexbase_token";
const TOKEN_COOKIE_NAME = "nexbase_token";

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7;

/**
 * Persists JWT for client fetches (localStorage) and for middleware (non-httpOnly cookie).
 */
function cookieSecureFlag(): string {
  return typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax${cookieSecureFlag()}`;
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  document.cookie = `${TOKEN_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${cookieSecureFlag()}`;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}
