namespace ParkingBuildingManagement.Api.Common;

public static class SlotStatuses
{
    public const string Available = "Available";
    public const string Occupied = "Occupied";
    public const string Reserved = "Reserved";
    public const string Maintenance = "Maintenance";
    public const string Locked = "Locked";

    private static readonly HashSet<string> StaffSettable = new(StringComparer.Ordinal)
    {
        Available, Occupied, Reserved, Maintenance, Locked,
    };

    public static bool IsStaffSettable(string status) =>
        StaffSettable.Contains(status);
}
