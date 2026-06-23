import { describe, expect, it } from "vitest";
import { en } from "./locales/en";
import { vi } from "./locales/vi";

describe("i18n locales", () => {
  it("has matching top-level keys in vi and en", () => {
    expect(Object.keys(vi).sort()).toEqual(Object.keys(en).sort());
  });

  it("interpolates checkout message params", () => {
    const template = vi.staff.checkoutSuccess;
    const result = template.replace("{plate}", "30A-123.45").replace("{fee}", "50.000 ₫");
    expect(result).toContain("30A-123.45");
  });
});
