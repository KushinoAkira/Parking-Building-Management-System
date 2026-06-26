using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ParkingBuildingManagement.Api.Services;
using ParkingBuildingManagement.Api.Services.PayOs;

namespace ParkingBuildingManagement.Api.Controllers;

[ApiController]
[EnableRateLimiting("webhook")]
[Route("api/payos")]
public class PayOsWebhookController(
    IWalletService wallet,
    IPayOsPaymentService payOs,
    ILogger<PayOsWebhookController> logger) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook([FromBody] JsonElement body, CancellationToken ct)
    {
        if (!body.TryGetProperty("signature", out var sigEl))
            return BadRequest(new { error = "Missing signature." });

        var signature = sigEl.GetString() ?? "";
        if (!body.TryGetProperty("data", out var dataEl))
            return BadRequest(new { error = "Missing data." });

        if (!payOs.IsDemoMode)
        {
            var flat = PayOsSignature.FlattenJsonElement(dataEl);
            if (!payOs.VerifyWebhookSignature(signature, flat))
            {
                logger.LogWarning("PayOS webhook signature mismatch for order {OrderCode}",
                    dataEl.TryGetProperty("orderCode", out var oc) ? oc.ToString() : "?");
                return BadRequest(new { error = "Invalid signature." });
            }
        }

        var success = body.TryGetProperty("success", out var successEl) && successEl.GetBoolean();
        if (!success) return Ok(new { message = "Ignored." });

        if (!dataEl.TryGetProperty("orderCode", out var orderCodeEl))
            return BadRequest(new { error = "Missing orderCode." });

        var orderCode = orderCodeEl.GetInt64();
        if (orderCode <= 0)
            return BadRequest(new { error = "Invalid orderCode." });

        await wallet.CompleteTopUpByOrderCodeAsync(orderCode, ct);
        return Ok(new { message = "Received." });
    }
}
