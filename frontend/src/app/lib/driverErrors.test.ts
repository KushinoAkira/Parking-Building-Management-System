import { describe, expect, it } from "vitest";
import { toDriverErrorMessage } from "./driverErrors";
import { ApiError } from "./api";

const t = (key: string) =>
  ({
    "common.networkError": "Network unavailable",
    "common.timeoutError": "Request timeout",
  }[key] ?? key);

describe("toDriverErrorMessage", () => {
  it("maps network fetch failure", () => {
    const error = new TypeError("Failed to fetch");
    expect(toDriverErrorMessage(error, t, "Fallback error")).toBe("Network unavailable");
  });

  it("maps timeout api error", () => {
    const error = new ApiError("Timed out", 0);
    expect(toDriverErrorMessage(error, t, "Fallback error")).toBe("Request timeout");
  });

  it("returns explicit message for generic error", () => {
    expect(toDriverErrorMessage(new Error("Specific failure"), t, "Fallback error")).toBe("Specific failure");
  });
});
