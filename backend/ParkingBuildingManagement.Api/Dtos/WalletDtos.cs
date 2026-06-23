namespace ParkingBuildingManagement.Api.Dtos;

public record WalletSummaryDto(decimal Balance, IReadOnlyList<WalletTopUpDto> RecentTopUps);

public record WalletTopUpDto(
    int TopUpId,
    decimal Amount,
    string Status,
    long PayOsOrderCode,
    string? CheckoutUrl,
    string? QrCode,
    bool DemoMode,
    DateTime CreatedAt,
    DateTime? CompletedAt);

public record CreateTopUpRequest(decimal Amount);

public record CreateTopUpResponse(
    int TopUpId,
    decimal Amount,
    string Status,
    string CheckoutUrl,
    string QrCode,
    bool DemoMode);

public record DriverTransactionDto(
    string Type,
    int Id,
    decimal Amount,
    string PaymentMethod,
    DateTime PaymentTime,
    string Status,
    string? TicketCode,
    string? LicensePlate);

public record PayOsWebhookPayload(
    string Code,
    string Desc,
    bool Success,
    PayOsWebhookData? Data,
    string Signature);

public record PayOsWebhookData(
    long OrderCode,
    decimal Amount,
    string Description,
    string? PaymentLinkId,
    string? Code,
    string? Desc);
