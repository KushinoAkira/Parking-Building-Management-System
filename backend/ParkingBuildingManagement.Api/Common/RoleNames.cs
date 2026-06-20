namespace ParkingBuildingManagement.Api.Common;

public static class RoleNames
{
    public const string Admin = "Admin";
    public const string Manager = "Manager";
    public const string Staff = "Staff";
    public const string Driver = "Driver";

    public const string AdminOnly = Admin;
    public const string ManagerOrAdmin = $"{Manager},{Admin}";
    public const string StaffOrAbove = $"{Staff},{Manager},{Admin}";
    public const string DriverOrAbove = $"{Driver},{Staff},{Manager},{Admin}";
}
