namespace ParkingBuildingManagement.Api.Models;

public class ReportSnapshot
{
    public int ReportId { get; set; }
    public DateOnly ReportDate { get; set; }
    public int? VehicleTypeId { get; set; }
    public int TotalEntries { get; set; }
    public int TotalExits { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal? OccupancyRate { get; set; }
    public int? PeakHour { get; set; }
    public DateTime CreatedAt { get; set; }

    public VehicleType? VehicleType { get; set; }
}
