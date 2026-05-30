namespace ParkingBuildingManagement.Api.Models;

public class Feedback
{
    public int FeedbackId { get; set; }
    public int? UserId { get; set; }
    public int? SessionId { get; set; }
    public string FeedbackType { get; set; } = string.Empty;
    public string? Content { get; set; }
    public string Status { get; set; } = "New";
    public DateTime CreatedAt { get; set; }

    public User? User { get; set; }
    public ParkingSession? Session { get; set; }
}
