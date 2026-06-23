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
    { zoneId: 1, zoneCode: "A", vehicleTypeId: 1 },
    { zoneId: 2, zoneCode: "B", vehicleTypeId: 2 },
    { zoneId: 3, zoneCode: "C", vehicleTypeId: 4 },
    { zoneId: 4, zoneCode: "D", vehicleTypeId: 5 },
  ];

  it("hides generic EV when split types exist", () => {
    const bookable = bookableVehicleTypes(types);
    expect(bookable.map((t) => t.typeCode)).toEqual(["MOTORBIKE", "CAR", "EV_MOTORBIKE", "EV_CAR"]);
  });

  it("filters zones by vehicle type", () => {
    expect(zonesForVehicleType(zones, 2).map((z) => z.zoneCode)).toEqual(["B"]);
    expect(zonesForVehicleType(zones, 4).map((z) => z.zoneCode)).toEqual(["C"]);
    expect(zonesForVehicleType(zones, 5).map((z) => z.zoneCode)).toEqual(["D"]);
  });
});
