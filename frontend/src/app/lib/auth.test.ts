import { afterEach, describe, expect, it, vi } from "vitest";
import { clearAuth, getAuth, getRoleHomePath, saveAuth } from "./auth";

const sampleAuth = {
  token: "test-token",
  userId: 1,
  fullName: "Test User",
  email: "test@pbms.local",
  roleName: "Driver",
  expiresAt: new Date(Date.now() + 3600_000).toISOString(),
};

describe("auth helpers", () => {
  afterEach(() => {
    clearAuth();
    vi.unstubAllGlobals();
  });

  it("saveAuth and getAuth round-trip via localStorage", () => {
    saveAuth(sampleAuth, true);
    const auth = getAuth();
    expect(auth?.email).toBe(sampleAuth.email);
    expect(auth?.roleName).toBe("Driver");
  });

  it("clears expired token", () => {
    saveAuth(
      { ...sampleAuth, expiresAt: new Date(Date.now() - 1000).toISOString() },
      true,
    );
    expect(getAuth()).toBeNull();
  });

  it("getRoleHomePath maps roles", () => {
    expect(getRoleHomePath("Admin")).toBe("/admin");
    expect(getRoleHomePath("Manager")).toBe("/manager");
    expect(getRoleHomePath("Staff")).toBe("/staff-dashboard");
  });

  it("getRoleHomePath sends driver to mobile on narrow viewport", () => {
    vi.stubGlobal("innerWidth", 400);
    expect(getRoleHomePath("Driver")).toBe("/user-mobile");
    vi.stubGlobal("innerWidth", 1024);
    expect(getRoleHomePath("Driver")).toBe("/user-web");
  });
});
