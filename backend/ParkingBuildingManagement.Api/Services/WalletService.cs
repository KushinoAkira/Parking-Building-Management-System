using Microsoft.EntityFrameworkCore;
using System.Data;
using ParkingBuildingManagement.Api.Common;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Dtos;
using ParkingBuildingManagement.Api.Models;
using ParkingBuildingManagement.Api.Services.PayOs;

namespace ParkingBuildingManagement.Api.Services;

public interface IWalletService
{
    Task<WalletSummaryDto> GetWalletAsync(int userId, CancellationToken ct = default);
    Task<CreateTopUpResponse> CreateTopUpAsync(int userId, decimal amount, CancellationToken ct = default);
    Task<WalletTopUpDto?> GetTopUpAsync(int userId, int topUpId, CancellationToken ct = default);
    Task<bool> CompleteTopUpByOrderCodeAsync(long orderCode, CancellationToken ct = default);
    Task<WalletTopUpDto> SimulateTopUpAsync(int userId, int topUpId, CancellationToken ct = default);
    Task<IReadOnlyList<DriverTransactionDto>> GetDriverTransactionsAsync(int userId, CancellationToken ct = default);
    Task DeductWalletAsync(int userId, decimal amount, CancellationToken ct = default);
}

public class WalletService(
    ApplicationDbContext db,
    IPayOsPaymentService payOs,
    IParkingRealtimeNotifier realtime) : IWalletService
{
    private const decimal MinTopUp = 10_000m;
    private const decimal MaxTopUp = 50_000_000m;

    public async Task<WalletSummaryDto> GetWalletAsync(int userId, CancellationToken ct = default)
    {
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == userId, ct)
            ?? throw new BusinessException("User not found.", 404);

        var recent = await db.WalletTopUps.AsNoTracking()
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .Take(10)
            .Select(MapTopUp)
            .ToListAsync(ct);

        return new WalletSummaryDto(user.WalletBalance, recent);
    }

    public async Task<CreateTopUpResponse> CreateTopUpAsync(int userId, decimal amount, CancellationToken ct = default)
    {
        if (amount < MinTopUp || amount > MaxTopUp)
            throw new BusinessException($"Top-up amount must be between {MinTopUp:N0} and {MaxTopUp:N0} VND.", 400);

        var user = await db.Users.FirstOrDefaultAsync(u => u.UserId == userId, ct)
            ?? throw new BusinessException("User not found.", 404);

        var topUp = new WalletTopUp
        {
            UserId = user.UserId,
            Amount = amount,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow,
        };
        db.WalletTopUps.Add(topUp);
        await db.SaveChangesAsync(ct);

        topUp.PayOsOrderCode = 1_000_000_000L + topUp.TopUpId;
        await db.SaveChangesAsync(ct);

        var payOsResult = await payOs.CreatePaymentLinkAsync(
            new PayOsCreateRequest(topUp.PayOsOrderCode, amount, $"PBMS nap tien #{topUp.TopUpId}"),
            ct);

        topUp.CheckoutUrl = payOsResult.CheckoutUrl;
        topUp.QrCode = payOsResult.QrCode;
        topUp.PaymentLinkId = payOsResult.PaymentLinkId;
        await db.SaveChangesAsync(ct);

        return new CreateTopUpResponse(
            topUp.TopUpId,
            topUp.Amount,
            topUp.Status,
            payOsResult.CheckoutUrl,
            payOsResult.QrCode,
            payOsResult.DemoMode);
    }

    public async Task<WalletTopUpDto?> GetTopUpAsync(int userId, int topUpId, CancellationToken ct = default) =>
        await db.WalletTopUps.AsNoTracking()
            .Where(t => t.UserId == userId && t.TopUpId == topUpId)
            .Select(MapTopUp)
            .FirstOrDefaultAsync(ct);

    public async Task<bool> CompleteTopUpByOrderCodeAsync(long orderCode, CancellationToken ct = default)
    {
        Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction? tx = null;
        if (db.Database.SupportsTransactions())
            tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);

        try
        {
            var topUp = await db.WalletTopUps
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.PayOsOrderCode == orderCode, ct);
            if (topUp is null || topUp.Status == "Completed")
            {
                if (tx is not null) await tx.CommitAsync(ct);
                return topUp is not null;
            }

            topUp.Status = "Completed";
            topUp.CompletedAt = DateTime.UtcNow;
            topUp.User.WalletBalance += topUp.Amount;
            await db.SaveChangesAsync(ct);
            if (tx is not null) await tx.CommitAsync(ct);

            await realtime.NotifyWalletTopUpAsync(topUp.UserId, topUp.TopUpId, topUp.Amount, topUp.User.WalletBalance, ct);
            return true;
        }
        finally
        {
            if (tx is not null) await tx.DisposeAsync();
        }
    }

    public async Task<WalletTopUpDto> SimulateTopUpAsync(int userId, int topUpId, CancellationToken ct = default)
    {
        if (!payOs.IsDemoMode)
            throw new BusinessException("Simulation is only available in PayOS demo mode.", 400);

        var topUp = await db.WalletTopUps
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.UserId == userId && t.TopUpId == topUpId, ct)
            ?? throw new BusinessException("Top-up not found.", 404);

        if (topUp.Status != "Pending")
            throw new BusinessException($"Top-up is already {topUp.Status}.", 400);

        await CompleteTopUpByOrderCodeAsync(topUp.PayOsOrderCode, ct);
        return (await GetTopUpAsync(userId, topUpId, ct))!;
    }

    public async Task<IReadOnlyList<DriverTransactionDto>> GetDriverTransactionsAsync(int userId, CancellationToken ct = default)
    {
        var payments = await db.Payments.AsNoTracking()
            .Where(p => p.Session.UserId == userId)
            .Select(p => new DriverTransactionDto(
                "payment",
                p.PaymentId,
                p.Amount,
                p.PaymentMethod,
                p.PaymentTime,
                p.Status,
                p.Session.TicketCode,
                p.Session.LicensePlate))
            .ToListAsync(ct);

        var topUps = await db.WalletTopUps.AsNoTracking()
            .Where(t => t.UserId == userId && t.Status == "Completed")
            .Select(t => new DriverTransactionDto(
                "topup",
                t.TopUpId,
                t.Amount,
                "PayOS",
                t.CompletedAt ?? t.CreatedAt,
                t.Status,
                null,
                null))
            .ToListAsync(ct);

        return payments.Concat(topUps)
            .OrderByDescending(t => t.PaymentTime)
            .Take(100)
            .ToList();
    }

    public async Task DeductWalletAsync(int userId, decimal amount, CancellationToken ct = default)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.UserId == userId, ct)
            ?? throw new BusinessException("User not found.", 404);

        if (user.WalletBalance < amount)
            throw new BusinessException("Insufficient wallet balance.", 400);

        user.WalletBalance -= amount;
        await db.SaveChangesAsync(ct);
    }

    private static System.Linq.Expressions.Expression<Func<WalletTopUp, WalletTopUpDto>> MapTopUp =>
        t => new WalletTopUpDto(
            t.TopUpId,
            t.Amount,
            t.Status,
            t.PayOsOrderCode,
            t.CheckoutUrl,
            t.QrCode,
            t.PaymentLinkId != null && t.PaymentLinkId.StartsWith("demo-"),
            t.CreatedAt,
            t.CompletedAt);
}
