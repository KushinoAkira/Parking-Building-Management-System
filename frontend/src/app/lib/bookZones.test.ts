import { describe, expect, it } from "vitest";
import { bookableVehicleTypes, zonesForVehicleType } from "./bookZones";

describe("bookZones", () => {
  const types = [
    { vehicleTypeId: 1, typeCode: "MOTORBIKE", typeName: "Motorbike" },
    { vehicleTypeId: 2, typeCode: "CAR", typeName: "Car" },
    { vehicleTypeId: 3, typeCode: "EV", typeName: "Electric Vehicle" },
    { vehicleTypeId: 4, typeCode: "EV_MOTORBIKE", typeName: "Electric Motorbike" },
    { vehicleTypeId: 5, typeCode: "EV_CAR", typeName: "Electric Car" },
  ];

  const zones = [
    { zoneId: 1, zoneCode: "F1A", vehicleTypeId: 1 },
    { zoneId: 2, zoneCode: "F1E", vehicleTypeId: 4 },
    { zoneId: 3, zoneCode: "F2A", vehicleTypeId: 1 },
    { zoneId: 4, zoneCode: "F3E", vehicleTypeId: 5 },
    { zoneId: 5, zoneCode: "F3A", vehicleTypeId: 2 },
  ];

  it("hides generic EV when split types exist", () => {
    const bookable = bookableVehicleTypes(types);
    expect(bookable.map((t) => t.typeCode)).toEqual(["MOTORBIKE", "CAR", "EV_MOTORBIKE", "EV_CAR"]);
  });

  it("filters zones by vehicle type", () => {
    expect(zonesForVehicleType(zones, 1).map((z) => z.zoneCode)).toEqual(["F1A", "F2A"]);
    expect(zonesForVehicleType(zones, 4).map((z) => z.zoneCode)).toEqual(["F1E"]);
    expect(zonesForVehicleType(zones, 2).map((z) => z.zoneCode)).toEqual(["F3A"]);
    expect(zonesForVehicleType(zones, 5).map((z) => z.zoneCode)).toEqual(["F3E"]);
  });
});
