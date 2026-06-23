namespace ParkingBuildingManagement.Api.Services.Ocr;

public sealed class PlateOcrOptions
{
    public const string SectionName = "Ocr";

    /// <summary>LatinV5 (recommended for VN plates), EnglishV5, or ChineseV5.</summary>
    public string Model { get; set; } = "LatinV5";
}
