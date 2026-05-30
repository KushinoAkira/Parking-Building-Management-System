namespace ParkingBuildingManagement.Api.Models;

public class Incident
{
    public int IncidentId { get; set; }
    public int? SessionId { get; set; }
    public int? ReportedById { get; set; }
    public string IncidentType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal PenaltyFee { get; set; }
    public string Status { get; set; } = "Open";
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }

    public ParkingSession? Session { get; set; }
    public User? ReportedBy { get; set; }
}
