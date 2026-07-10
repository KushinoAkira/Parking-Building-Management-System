using System.Data;
using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Data;

namespace ParkingBuildingManagement.Api.Common;

public static class DbContextTransactionExtensions
{
    public static Task ExecuteInTransactionAsync(
        this ApplicationDbContext db,
        Func<Task> action,
        CancellationToken ct = default) =>
        db.ExecuteInTransactionAsync(action, isolationLevel: null, ct);

    public static async Task ExecuteInTransactionAsync(
        this ApplicationDbContext db,
        Func<Task> action,
        IsolationLevel? isolationLevel,
        CancellationToken ct = default)
    {
        if (!db.Database.SupportsTransactions())
        {
            await action();
            return;
        }

        await using var tx = isolationLevel.HasValue
            ? await db.Database.BeginTransactionAsync(isolationLevel.Value, ct)
            : await db.Database.BeginTransactionAsync(ct);
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
