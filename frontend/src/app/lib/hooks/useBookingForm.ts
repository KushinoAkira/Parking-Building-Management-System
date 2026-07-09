import { useEffect, useMemo, useState } from "react";
import {
  bookableVehicleTypes,
  normalizeBookZoneId,
  zonesForVehicleType,
  type BookVehicleType,
  type BookZone,
} from "../bookZones";

export function useBookingForm(vehicleTypes: BookVehicleType[], zones: BookZone[], initialPlate?: string) {
  const [bookPlate, setBookPlate] = useState("");
  const [bookVehicleTypeId, setBookVehicleTypeId] = useState(1);
  const [bookZoneId, setBookZoneId] = useState<number | "">("");
  const [bookPreferVip, setBookPreferVip] = useState(false);
  const [vipSurchargeAmount, setVipSurchargeAmount] = useState(10_000);

  const bookingVehicleTypes = useMemo(() => bookableVehicleTypes(vehicleTypes), [vehicleTypes]);
  const bookingZones = useMemo(
    () => zonesForVehicleType(zones, bookVehicleTypeId),
    [zones, bookVehicleTypeId],
  );

  useEffect(() => {
    if (initialPlate) setBookPlate((prev) => prev || initialPlate);
  }, [initialPlate]);

  useEffect(() => {
    if (bookingVehicleTypes.length === 0) return;
    if (!bookingVehicleTypes.some((vt) => vt.vehicleTypeId === bookVehicleTypeId)) {
      setBookVehicleTypeId(bookingVehicleTypes[0].vehicleTypeId);
    }
  }, [bookingVehicleTypes, bookVehicleTypeId]);

  useEffect(() => {
    setBookZoneId((prev) => normalizeBookZoneId(prev, bookingZones));
  }, [bookVehicleTypeId, bookingZones]);

  return {
    bookPlate,
    setBookPlate,
    bookVehicleTypeId,
    setBookVehicleTypeId,
    bookZoneId,
    setBookZoneId,
    bookPreferVip,
    setBookPreferVip,
    vipSurchargeAmount,
    setVipSurchargeAmount,
    bookingVehicleTypes,
    bookingZones,
  };
}
