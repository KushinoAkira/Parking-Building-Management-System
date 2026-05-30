namespace ParkingBuildingManagement.Api.Models;

public class ParkingZone
{
    public int ZoneId { get; set; }
    public string ZoneCode { get; set; } = string.Empty;
    public string ZoneName { get; set; } = string.Empty;
    public int VehicleTypeId { get; set; }
    public int Capacity { get; set; }
    public string Status { get; set; } = "Active";

    public VehicleType VehicleType { get; set; } = null!;
    public ICollection<ParkingSlot> ParkingSlots { get; set; } = [];
    public ICollection<Reservation> Reservations { get; set; } = [];
    public ICollection<ParkingSession> ParkingSessions { get; set; } = [];
}
