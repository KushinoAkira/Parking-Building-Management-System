namespace ParkingBuildingManagement.Api.Models;

public class User
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public int RoleId { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; }
    public decimal WalletBalance { get; set; }

    public Role Role { get; set; } = null!;
    public ICollection<Reservation> Reservations { get; set; } = [];
    public ICollection<ParkingSession> DriverSessions { get; set; } = [];
    public ICollection<ParkingSession> EntryStaffSessions { get; set; } = [];
    public ICollection<ParkingSession> ExitStaffSessions { get; set; } = [];
    public ICollection<Incident> ReportedIncidents { get; set; } = [];
    public ICollection<Feedback> Feedbacks { get; set; } = [];
    public ICollection<WalletTopUp> WalletTopUps { get; set; } = [];
    public ICollection<Subscription> Subscriptions { get; set; } = [];
}
