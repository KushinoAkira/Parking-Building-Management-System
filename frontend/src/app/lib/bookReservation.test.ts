import { describe, expect, it, vi, beforeEach } from "vitest";
import { createAndConfirmReservation } from "./bookReservation";

const apiPost = vi.fn();

vi.mock("./api", () => ({
  apiPost: (...args: unknown[]) => apiPost(...args),
}));

describe("createAndConfirmReservation", () => {
  beforeEach(() => {
    apiPost.mockReset();
  });

  it("confirms after create", async () => {
    apiPost
      .mockResolvedValueOnce({ reservationId: 42 })
      .mockResolvedValueOnce({});

    const id = await createAndConfirmReservation(
      {
        userId: 1,
        vehicleTypeId: 2,
        zoneId: 3,
        slotId: null,
        licensePlate: "51A-12345",
        reservedFrom: "2026-06-26T10:00:00Z",
        reservedTo: "2026-06-26T12:00:00Z",
      },
      "token",
    );

    expect(id).toBe(42);
    expect(apiPost).toHaveBeenCalledTimes(2);
  });

  it("cancels pending reservation when confirm fails", async () => {
    apiPost
      .mockResolvedValueOnce({ reservationId: 7 })
      .mockRejectedValueOnce(new Error("confirm failed"))
      .mockResolvedValueOnce({});

    await expect(
      createAndConfirmReservation(
        {
          userId: 1,
          vehicleTypeId: 2,
          zoneId: null,
          slotId: null,
          licensePlate: "51A-12345",
          reservedFrom: "2026-06-26T10:00:00Z",
          reservedTo: "2026-06-26T12:00:00Z",
        },
        "token",
      ),
    ).rejects.toThrow("confirm failed");

    expect(apiPost).toHaveBeenNthCalledWith(3, "/api/reservations/7/cancel", {}, "token");
  });
});
