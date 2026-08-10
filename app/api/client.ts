import type { ApiProblem } from "./contracts";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:5260" : "")
).replace(/\/$/, "");
const TOKEN_KEY = "flujo-access-token";
let refreshRequest: Promise<string | null> | null = null;

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly problem?: ApiProblem) {
    super(problem?.detail ?? problem?.message ?? problem?.title ?? `Error HTTP ${status}`);
    this.name = "ApiError";
  }
}

export function getAccessToken() {
  return typeof window === "undefined" ? null : window.sessionStorage.getItem(TOKEN_KEY);
}

export function saveAccessToken(token: string) {
  window.sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken() {
  window.sessionStorage.removeItem(TOKEN_KEY);
}

async function refreshAccessToken() {
  if (refreshRequest) return refreshRequest;

  refreshRequest = (async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        clearAccessToken();
        return null;
      }

      const result = (await response.json()) as { token: string };
      saveAccessToken(result.token);
      return result.token;
    } catch {
      clearAccessToken();
      return null;
    } finally {
      refreshRequest = null;
    }
  })();

  return refreshRequest;
}

async function sendRequest(
  path: string,
  init: RequestInit,
  baseHeaders: Headers,
  token?: string,
) {
  const headers = new Headers(baseHeaders);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  let token: string | null = null;
  if (authenticated) {
    token = getAccessToken() ?? await refreshAccessToken();
    if (!token) throw new ApiError(401, { detail: "Debes iniciar sesión." });
  }

  let response = await sendRequest(path, init, headers, token ?? undefined);

  if (authenticated && response.status === 401) {
    const currentToken = getAccessToken();
    const renewedToken = currentToken && currentToken !== token
      ? currentToken
      : await refreshAccessToken();

    if (renewedToken) {
      response = await sendRequest(path, init, headers, renewedToken);
    }
  }

  if (!response.ok) {
    let problem: ApiProblem | undefined;
    try {
      problem = (await response.json()) as ApiProblem;
    } catch {
      problem = undefined;
    }
    throw new ApiError(response.status, problem);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
