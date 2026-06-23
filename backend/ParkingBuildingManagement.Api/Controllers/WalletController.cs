using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ParkingBuildingManagement.Api.Common;
using ParkingBuildingManagement.Api.Dtos;
using ParkingBuildingManagement.Api.Services;

namespace ParkingBuildingManagement.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.DriverOrAbove)]
[EnableRateLimiting("wallet")]
[Route("api/portal/driver/{userId:int}/wallet")]
public class WalletController(IWalletService wallet) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetWallet(int userId, CancellationToken ct)
    {
        if (!User.CanAccessUserData(userId)) return Forbid();
        return Ok(await wallet.GetWalletAsync(userId, ct));
    }

    [HttpPost("top-up")]
    public async Task<IActionResult> CreateTopUp(int userId, [FromBody] CreateTopUpRequest request, CancellationToken ct)
    {
        if (!User.CanAccessUserData(userId)) return Forbid();
        return Ok(await wallet.CreateTopUpAsync(userId, request.Amount, ct));
    }

    [HttpGet("top-ups/{topUpId:int}")]
    public async Task<IActionResult> GetTopUp(int userId, int topUpId, CancellationToken ct)
    {
        if (!User.CanAccessUserData(userId)) return Forbid();
        var topUp = await wallet.GetTopUpAsync(userId, topUpId, ct);
        return topUp is null ? NotFound() : Ok(topUp);
    }

    [HttpPost("top-ups/{topUpId:int}/simulate")]
    public async Task<IActionResult> SimulateTopUp(int userId, int topUpId, CancellationToken ct)
    {
        if (!User.CanAccessUserData(userId)) return Forbid();
        return Ok(await wallet.SimulateTopUpAsync(userId, topUpId, ct));
    }
}
