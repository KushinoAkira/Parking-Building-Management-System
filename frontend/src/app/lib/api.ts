import { clearAuth } from "./auth";

/** Empty = same-origin (Vite dev proxy → backend). Set VITE_API_BASE_URL only for production deploy. */
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

const DEFAULT_TIMEOUT_MS = 30_000;

/** Resolve API path — relative in dev (Vite proxy); absolute when VITE_API_BASE_URL is set. */
export function apiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${normalized}` : normalized;
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError && error.message === "Failed to fetch";
}

export function isTimeoutError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0;
}

export function formatApiError(
  error: unknown,
  messages: { network: string; timeout: string; fallback: string },
): string {
  if (isNetworkError(error)) return messages.network;
  if (isTimeoutError(error)) return messages.timeout;
  return error instanceof Error ? error.message : messages.fallback;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function handleUnauthorized() {
  if (typeof window === "undefined") return;
  const authRaw =
    localStorage.getItem("pbms_auth") ?? sessionStorage.getItem("pbms_auth");
  if (!authRaw) return;
  clearAuth();
  const path = window.location.pathname;
  if (path !== "/" && path !== "/login") {
    window.location.href = "/login";
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    if (res.status === 401) handleUnauthorized();

    let message = `Request failed with status ${res.status}`;
    if (typeof payload === "object" && payload !== null) {
      if ("error" in payload && typeof payload.error === "string") {
        message = payload.error;
      } else if ("message" in payload && typeof payload.message === "string") {
        message = payload.message;
      } else if ("title" in payload && typeof payload.title === "string") {
        message = payload.title;
      } else if ("errors" in payload && typeof payload.errors === "object") {
        const errs = Object.values(payload.errors as Record<string, string[]>).flat();
        message = errs.length > 0 ? errs[0] : message;
      }
    } else if (typeof payload === "string" && payload.length > 0 && payload.length < 300) {
      message = payload;
    }
    throw new ApiError(message, res.status);
  }

  return payload as T;
}

type FetchOptions = { timeoutMs?: number };

async function fetchApi(url: string, init?: RequestInit, options?: FetchOptions): Promise<Response> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(apiUrl(url), { ...init, signal: controller.signal });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new ApiError("Request timed out", 0);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export async function apiGet<T>(url: string, token?: string, options?: FetchOptions): Promise<T> {
  const res = await fetchApi(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }, options);
  return parseResponse<T>(res);
}

export async function apiPost<T>(url: string, body: unknown, token?: string, options?: FetchOptions): Promise<T> {
  const res = await fetchApi(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  }, options);
  return parseResponse<T>(res);
}

export async function apiPut<T>(url: string, body: unknown, token?: string, options?: FetchOptions): Promise<T> {
  const res = await fetchApi(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  }, options);
  return parseResponse<T>(res);
}

export async function apiDelete<T>(url: string, token?: string, options?: FetchOptions): Promise<T> {
  const res = await fetchApi(url, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }, options);
  return parseResponse<T>(res);
}

export async function apiPostForm<T>(url: string, form: FormData, token?: string, options?: FetchOptions): Promise<T> {
  const res = await fetchApi(url, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  }, { timeoutMs: options?.timeoutMs ?? 120_000 });
  return parseResponse<T>(res);
}
