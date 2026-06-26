import { describe, expect, it } from "vitest";
import { isVipSlot, slotTier } from "./parkingSlots";

describe("parkingSlots", () => {
  it("marks slot number 1 as VIP", () => {
    expect(isVipSlot("F1A1")).toBe(true);
    expect(isVipSlot("F1E1")).toBe(true);
    expect(isVipSlot("A1")).toBe(true);
  });

  it("does not mark other slot numbers as VIP", () => {
    expect(isVipSlot("A2")).toBe(false);
    expect(isVipSlot("A11")).toBe(false);
    expect(isVipSlot("A10")).toBe(false);
  });

  it("uses note when present", () => {
    expect(slotTier("A2", "VIP")).toBe("VIP");
    expect(slotTier("A2")).toBe("Standard");
    expect(slotTier("F1A1")).toBe("VIP");
  });
});
