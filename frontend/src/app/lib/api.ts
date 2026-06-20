import { clearAuth } from "./auth";

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

export async function apiGet<T>(url: string, token?: string): Promise<T> {
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return parseResponse<T>(res);
}

export async function apiPost<T>(url: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(res);
}

export async function apiPut<T>(url: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(res);
}

export async function apiDelete<T>(url: string, token?: string): Promise<T> {
  const res = await fetch(url, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return parseResponse<T>(res);
}
