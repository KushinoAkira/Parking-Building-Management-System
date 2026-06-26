namespace ParkingBuildingManagement.Api.Services.PayOs;

public class PayOsOptions
{
    public const string SectionName = "PayOs";

    public string ClientId { get; set; } = "";
    public string ApiKey { get; set; } = "";
    public string ChecksumKey { get; set; } = "";
    public string ReturnUrl { get; set; } = "http://localhost:5173/user-web?topup=success";
    public string CancelUrl { get; set; } = "http://localhost:5173/user-web?topup=cancel";
    public bool DemoMode { get; set; } = true;
}

public record PayOsCreateRequest(long OrderCode, decimal Amount, string Description);

public record PayOsCreateResult(
    string CheckoutUrl,
    string QrCode,
    string PaymentLinkId,
    bool DemoMode);

public interface IPayOsPaymentService
{
    bool IsDemoMode { get; }
    Task<PayOsCreateResult> CreatePaymentLinkAsync(PayOsCreateRequest request, CancellationToken ct = default);
    bool VerifyWebhookSignature(string signature, IReadOnlyDictionary<string, string> data);
}
