namespace ParkingBuildingManagement.Api.Models;

public class VehicleType
{
    public int VehicleTypeId { get; set; }
    public string TypeCode { get; set; } = string.Empty;
    public string TypeName { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";

    public ICollection<ParkingZone> ParkingZones { get; set; } = [];
    public ICollection<PricingPolicy> PricingPolicies { get; set; } = [];
    public ICollection<Reservation> Reservations { get; set; } = [];
    public ICollection<ParkingSession> ParkingSessions { get; set; } = [];
    public ICollection<ReportSnapshot> ReportSnapshots { get; set; } = [];
}
