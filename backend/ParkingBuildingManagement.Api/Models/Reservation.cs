namespace ParkingBuildingManagement.Api.Models;

public class Reservation
{
    public int ReservationId { get; set; }
    public int UserId { get; set; }
    public int VehicleTypeId { get; set; }
    public int? ZoneId { get; set; }
    public string? SlotId { get; set; }
    public string? LicensePlate { get; set; }
    public DateTime ReservedFrom { get; set; }
    public DateTime ReservedTo { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime CreatedAt { get; set; }

    public User User { get; set; } = null!;
    public VehicleType VehicleType { get; set; } = null!;
    public ParkingZone? Zone { get; set; }
    public ParkingSlot? Slot { get; set; }
    public ICollection<ParkingSession> ParkingSessions { get; set; } = [];
}
