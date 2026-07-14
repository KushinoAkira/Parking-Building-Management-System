namespace ParkingBuildingManagement.Api.Models;

public class Subscription
{
    public int SubscriptionId { get; set; }
    public int UserId { get; set; }
    public int PlanId { get; set; }
    public int VehicleTypeId { get; set; }
    public int? ZoneId { get; set; }
    public string LicensePlate { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal PricePaid { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; }

    public User User { get; set; } = null!;
    public SubscriptionPlan Plan { get; set; } = null!;
    public VehicleType VehicleType { get; set; } = null!;
    public ParkingZone? Zone { get; set; }
}
