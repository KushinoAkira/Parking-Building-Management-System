using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace ParkingBuildingManagement.Api.Services.PayOs;

public class PayOsPaymentService(
    HttpClient http,
    IOptions<PayOsOptions> options,
    ILogger<PayOsPaymentService> logger) : IPayOsPaymentService
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    private readonly PayOsOptions _options = options.Value;

    public bool IsDemoMode => false;

    public async Task<PayOsCreateResult> CreatePaymentLinkAsync(PayOsCreateRequest request, CancellationToken ct = default)
    {
        var body = new
        {
            orderCode = request.OrderCode,
            amount = (int)request.Amount,
            description = request.Description,
            returnUrl = _options.ReturnUrl,
            cancelUrl = _options.CancelUrl,
        };

        using var msg = new HttpRequestMessage(HttpMethod.Post, "https://api-merchant.payos.vn/v2/payment-requests");
        msg.Headers.Add("x-client-id", _options.ClientId);
        msg.Headers.Add("x-api-key", _options.ApiKey);
        msg.Content = new StringContent(JsonSerializer.Serialize(body, JsonOpts), Encoding.UTF8, "application/json");

        var res = await http.SendAsync(msg, ct);
        var json = await res.Content.ReadAsStringAsync(ct);
        if (!res.IsSuccessStatusCode)
        {
            logger.LogWarning("PayOS create payment failed: {Status} {Body}", res.StatusCode, json);
            throw new InvalidOperationException("PayOS payment link creation failed.");
        }

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        if (root.TryGetProperty("code", out var code) && code.GetString() != "00")
            throw new InvalidOperationException(root.TryGetProperty("desc", out var desc) ? desc.GetString() : "PayOS error");

        var data = root.GetProperty("data");
        return new PayOsCreateResult(
            data.GetProperty("checkoutUrl").GetString() ?? "",
            data.TryGetProperty("qrCode", out var qr) ? qr.GetString() ?? "" : "",
            data.TryGetProperty("paymentLinkId", out var linkId) ? linkId.GetString() ?? "" : "",
            DemoMode: false);
    }

    public bool VerifyWebhookSignature(string signature, IReadOnlyDictionary<string, string> data) =>
        PayOsSignature.Verify(signature, data, _options.ChecksumKey);
}
