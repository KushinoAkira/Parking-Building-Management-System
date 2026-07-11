namespace ParkingBuildingManagement.Api.Common;

public static class RoleNames
{
    public const string Admin = "Admin";
    public const string Manager = "Manager";
    public const string Staff = "Staff";
    public const string Driver = "Driver";

    public const string AdminOnly = Admin;
    public const string ManagerOnly = Manager;
    public const string ManagerOrAdmin = $"{Manager},{Admin}";
    public const string StaffOrAbove = $"{Staff},{Manager},{Admin}";
    public const string DriverOrAbove = $"{Driver},{Staff},{Manager},{Admin}";

    /// <summary>Admin / Manager / Staff — provisioned accounts; password login only.</summary>
    public static bool IsInternalStaffRole(string? roleName) =>
        roleName is Admin or Manager or Staff;
}
