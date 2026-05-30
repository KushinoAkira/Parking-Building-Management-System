namespace ParkingBuildingManagement.Api.Models;

public class ParkingFacility
{
    public int FacilityId { get; set; }
    public string FacilityName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public TimeOnly OpenTime { get; set; }
    public TimeOnly CloseTime { get; set; }
    public string Status { get; set; } = "Active";
    public string? Description { get; set; }
}
