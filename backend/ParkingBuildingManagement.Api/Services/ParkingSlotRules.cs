namespace ParkingBuildingManagement.Api.Services;

public static class ParkingSlotRules
{
    /// <summary>Slot *1 (A1, M1G1, …) — gần lối ra, dễ di chuyển.</summary>
    public static bool IsVipSlot(string slotId)
    {
        if (string.IsNullOrWhiteSpace(slotId)) return false;
        var match = System.Text.RegularExpressions.Regex.Match(slotId, @"(\d+)$");
        return match.Success && int.TryParse(match.Groups[1].Value, out var n) && n == 1;
    }
}
