using Microsoft.Extensions.Options;

namespace ParkingBuildingManagement.Api.Services.PayOs;

public class StubPayOsPaymentService(IOptions<PayOsOptions> options) : IPayOsPaymentService
{
    private readonly PayOsOptions _options = options.Value;

    public bool IsDemoMode => true;

    public Task<PayOsCreateResult> CreatePaymentLinkAsync(PayOsCreateRequest request, CancellationToken ct = default)
    {
        var checkoutUrl = $"{_options.ReturnUrl}&orderCode={request.OrderCode}&demo=1";
        var qrCode = $"https://img.vietqr.io/image/970422-demo.png?amount={request.Amount:0}&addInfo=PBMS-{request.OrderCode}";
        return Task.FromResult(new PayOsCreateResult(
            checkoutUrl,
            qrCode,
            $"demo-{request.OrderCode}",
            DemoMode: true));
    }

    public bool VerifyWebhookSignature(string signature, IReadOnlyDictionary<string, string> data) => true;
}
