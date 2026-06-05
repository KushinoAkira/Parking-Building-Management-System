namespace ParkingBuildingManagement.Api.Models;

public class ParkingSession
{
    public int SessionId { get; set; }
    public string TicketCode { get; set; } = string.Empty;
    public int? UserId { get; set; }
    public int? ReservationId { get; set; }
    public int VehicleTypeId { get; set; }
    public int ZoneId { get; set; }
    public string SlotId { get; set; } = string.Empty;
    public string LicensePlate { get; set; } = string.Empty;
    public DateTime EntryTime { get; set; }
    public DateTime? ExitTime { get; set; }
    public string? EntryGate { get; set; }
    public string? ExitGate { get; set; }
    public decimal? EstimatedFee { get; set; }
    public decimal? TotalFee { get; set; }
    public string Status { get; set; } = "Active";
    public int? EntryStaffId { get; set; }
    public int? ExitStaffId { get; set; }
    public string? Note { get; set; }

    public User? User { get; set; }
    public Reservation? Reservation { get; set; }
    public VehicleType VehicleType { get; set; } = null!;
    public ParkingZone Zone { get; set; } = null!;
    public ParkingSlot Slot { get; set; } = null!;
    public User? EntryStaff { get; set; }
    public User? ExitStaff { get; set; }
    public ICollection<Payment> Payments { get; set; } = [];
    public ICollection<Incident> Incidents { get; set; } = [];
    public ICollection<Feedback> Feedbacks { get; set; } = [];
}
