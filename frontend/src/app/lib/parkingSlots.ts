/** Slot *1 (A1, M1G1, …) — gần lối ra, dễ di chuyển. */
export function isVipSlot(slotId: string): boolean {
  const match = slotId.match(/(\d+)$/);
  if (!match) return false;
  return Number(match[1]) === 1;
}

export type SlotTier = "VIP" | "Standard";

export function slotTier(slotId: string, note?: string | null): SlotTier {
  if (note === "VIP" || isVipSlot(slotId)) return "VIP";
  return "Standard";
}
