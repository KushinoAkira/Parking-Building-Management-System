namespace ParkingBuildingManagement.Api.Models;

public class Payment
{
    public int PaymentId { get; set; }
    public int SessionId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public DateTime PaymentTime { get; set; }
    public string Status { get; set; } = "Completed";

    public ParkingSession Session { get; set; } = null!;
}
