using ParkingBuildingManagement.Api.Data;

namespace ParkingBuildingManagement.Api.Common;

public static class DbContextTransactionExtensions
{
    public static async Task ExecuteInTransactionAsync(
        this ApplicationDbContext db,
        Func<Task> action,
        CancellationToken ct = default)
    {
        if (!db.Database.SupportsTransactions())
        {
            await action();
            return;
        }

        await using var tx = await db.Database.BeginTransactionAsync(ct);
        try
        {
            await action();
            await tx.CommitAsync(ct);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }
}
