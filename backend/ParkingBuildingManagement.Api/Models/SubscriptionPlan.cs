namespace ParkingBuildingManagement.Api.Models;

public class SubscriptionPlan
{
    public int PlanId { get; set; }
    public string PlanName { get; set; } = string.Empty;
    public int VehicleTypeId { get; set; }
    public int? ZoneId { get; set; }
    public int DurationDays { get; set; }
    public decimal Price { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; }

    public VehicleType VehicleType { get; set; } = null!;
    public ParkingZone? Zone { get; set; }
    public ICollection<Subscription> Subscriptions { get; set; } = [];
}
