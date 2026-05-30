namespace ParkingBuildingManagement.Api.Models;

public class ParkingSlot
{
    public string SlotId { get; set; } = string.Empty;
    public int ZoneId { get; set; }
    public string Status { get; set; } = "Available";
    public string? Note { get; set; }

    public ParkingZone Zone { get; set; } = null!;
    public ICollection<Reservation> Reservations { get; set; } = [];
    public ICollection<ParkingSession> ParkingSessions { get; set; } = [];
}
