namespace ParkingBuildingManagement.Api.Common;

public class BusinessException(string message, int statusCode = 400) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}
