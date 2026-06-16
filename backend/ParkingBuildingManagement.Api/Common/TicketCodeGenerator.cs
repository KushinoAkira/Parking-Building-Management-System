namespace ParkingBuildingManagement.Api.Common;

public static class TicketCodeGenerator
{
    public static string Generate() =>
        $"PBMS-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
}
