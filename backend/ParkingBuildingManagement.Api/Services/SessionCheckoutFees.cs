using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Data;

namespace ParkingBuildingManagement.Api.Services;

public static class SessionCheckoutFees
{
    public static async Task<(decimal PenaltyFee, decimal VipSurcharge)> GetExtrasAsync(
        ApplicationDbContext db,
        int sessionId,
        int? reservationId,
        CancellationToken ct)
    {
        var penaltyFee = await db.Incidents
            .Where(i => i.SessionId == sessionId && i.Status == "Open")
            .SumAsync(i => i.PenaltyFee, ct);

        decimal vipSurcharge = 0;
        if (reservationId.HasValue)
        {
            var amount = await db.Reservations.AsNoTracking()
                .Where(r => r.ReservationId == reservationId.Value)
                .Select(r => r.VipSurcharge)
                .FirstOrDefaultAsync(ct);
            if (amount is > 0)
                vipSurcharge = amount.Value;
        }

        return (penaltyFee, vipSurcharge);
    }
}
