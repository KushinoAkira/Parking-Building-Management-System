using System.Security.Claims;

namespace ParkingBuildingManagement.Api.Common;

public static class UserClaimsExtensions
{
    public static int? GetUserId(this ClaimsPrincipal user)
    {
        var raw = user.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(raw, out var id) ? id : null;
    }

    public static string? GetRoleName(this ClaimsPrincipal user) =>
        user.FindFirstValue(ClaimTypes.Role);

    public static bool IsStaffOrAbove(this ClaimsPrincipal user)
    {
        var role = user.GetRoleName();
        return role is RoleNames.Staff or RoleNames.Manager or RoleNames.Admin;
    }

    public static bool CanAccessUserData(this ClaimsPrincipal user, int userId)
    {
        if (user.IsStaffOrAbove()) return true;
        return user.GetUserId() == userId;
    }
}
