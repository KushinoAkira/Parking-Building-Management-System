export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      typeof payload === "object" && payload !== null && "error" in payload
        ? String(payload.error)
        : `Request failed with status ${res.status}`;
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
