import type { ApiProblem } from "./contracts";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5260").replace(/\/$/, "");
const TOKEN_KEY = "flujo-access-token";

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

export async function apiRequest<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  if (authenticated) {
    const token = getAccessToken();
    if (!token) throw new ApiError(401, { detail: "Debes iniciar sesión." });
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
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
