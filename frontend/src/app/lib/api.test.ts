import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiGet } from "./api";

describe("api helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("apiGet returns parsed JSON on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => ({ status: "ok" }),
      }),
    );

    const data = await apiGet<{ status: string }>("/api/health");
    expect(data.status).toBe("ok");
  });

  it("apiGet throws ApiError with backend message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        headers: { get: () => "application/json" },
        json: async () => ({ error: "License plate already active" }),
      }),
    );

    await expect(apiGet("/api/parking-sessions/check-in")).rejects.toMatchObject({
      message: "License plate already active",
      status: 400,
    } satisfies Partial<ApiError>);
  });
});
