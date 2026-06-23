using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using ParkingBuildingManagement.Api.Common;
using System.Security.Claims;

namespace ParkingBuildingManagement.Api.Hubs;

[Authorize]
public class ParkingHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "all");

        var role = Context.User?.FindFirstValue(ClaimTypes.Role);
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);

        if (role is RoleNames.Staff or RoleNames.Manager or RoleNames.Admin)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "operations");
        }

        if (role == RoleNames.Staff)
            await Groups.AddToGroupAsync(Context.ConnectionId, "staff");

        if (role == RoleNames.Manager)
            await Groups.AddToGroupAsync(Context.ConnectionId, "manager");

        if (role == RoleNames.Admin)
            await Groups.AddToGroupAsync(Context.ConnectionId, "admin");

        if (role == RoleNames.Driver && userId is not null)
            await Groups.AddToGroupAsync(Context.ConnectionId, $"driver:{userId}");

        await base.OnConnectedAsync();
    }
}
