import { apiPost } from "./api";

export type CreateReservationPayload = {
  userId: number;
  vehicleTypeId: number;
  zoneId: number | null;
  slotId: string | null;
  licensePlate: string;
  reservedFrom: string;
  reservedTo: string;
};

/** Creates a reservation and confirms it; cancels the pending reservation if confirm fails. */
export async function createAndConfirmReservation(
  payload: CreateReservationPayload,
  token: string,
): Promise<number> {
  const created = await apiPost<{ reservationId: number }>("/api/reservations", payload, token);
  try {
    await apiPost(`/api/reservations/${created.reservationId}/confirm`, {}, token);
    return created.reservationId;
  } catch (error) {
    try {
      await apiPost(`/api/reservations/${created.reservationId}/cancel`, {}, token);
    } catch {
      // Best-effort rollback so Pending reservations do not linger.
    }
    throw error;
  }
}
