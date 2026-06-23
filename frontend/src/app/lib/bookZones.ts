export type BookZone = {
  zoneId: number;
  zoneCode?: string;
  zoneName?: string;
  vehicleTypeId: number;
  vehicleTypeCode?: string;
  vehicleType?: string;
  capacity?: number;
  availableSlots?: number;
};

export type BookVehicleType = {
  vehicleTypeId: number;
  typeName: string;
  typeCode: string;
};

/** Hide legacy generic EV when split EV types exist. */
export function bookableVehicleTypes(types: BookVehicleType[]): BookVehicleType[] {
  const hasEvSplit = types.some((t) => t.typeCode === "EV_MOTORBIKE" || t.typeCode === "EV_CAR");
  if (!hasEvSplit) return types;
  return types.filter((t) => t.typeCode !== "EV");
}

export function zonesForVehicleType(zones: BookZone[], vehicleTypeId: number): BookZone[] {
  return zones.filter((z) => z.vehicleTypeId === vehicleTypeId);
}

export function normalizeBookZoneId(
  zoneId: number | "",
  matchingZones: BookZone[],
): number | "" {
  if (zoneId === "") return "";
  if (matchingZones.some((z) => z.zoneId === zoneId)) return zoneId;
  return matchingZones.length === 1 ? matchingZones[0].zoneId : "";
}
