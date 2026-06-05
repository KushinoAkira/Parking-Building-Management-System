namespace ParkingBuildingManagement.Api.Models;

public class PricingPolicy
{
    public int PolicyId { get; set; }
    public int VehicleTypeId { get; set; }
    public string PolicyName { get; set; } = string.Empty;
    public decimal PricePerHour { get; set; }
    public decimal? DailyMaxFee { get; set; }
    public decimal LostTicketFee { get; set; }
    public decimal OvertimeFee { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; }

    public VehicleType VehicleType { get; set; } = null!;
}
