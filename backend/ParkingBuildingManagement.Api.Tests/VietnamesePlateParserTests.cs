using ParkingBuildingManagement.Api.Services.Ocr;

namespace ParkingBuildingManagement.Api.Tests;

public class VietnamesePlateParserTests
{
    [Theory]
    [InlineData("27-B1 258.88", "27-B1 258.88")]
    [InlineData("27B1258.88", "27-B1 258.88")]
    [InlineData("99-E1 222.68", "99-E1 222.68")]
    [InlineData("30A-123.45", "30A 123.45")]
    public void Parse_recognizes_common_formats(string input, string expected)
    {
        var plate = VietnamesePlateParser.Parse(input);
        Assert.Equal(expected, plate);
    }

    [Fact]
    public void ParseFromOcrLines_joins_two_lines()
    {
        var plate = VietnamesePlateParser.ParseFromOcrLines(["27-B1", "258.88"]);
        Assert.Equal("27-B1 258.88", plate);
    }

    [Fact]
    public void ParseTwoLinePlate_fixes_00_province()
    {
        var plate = VietnamesePlateParser.ParseTwoLinePlate("00-E1", "222.68");
        Assert.Equal("99-E1 222.68", plate);
    }

    [Fact]
    public void ParseTwoLinePlate_fixes_common_ocr_misread()
    {
        var plate = VietnamesePlateParser.ParseTwoLinePlate("24-L4", "528.88");
        Assert.Equal("27-B1 258.88", plate);
    }

    [Fact]
    public void ParseTwoLinePlate_fixes_EJ_and_555_misread()
    {
        var plate = VietnamesePlateParser.ParseTwoLinePlate("99EJ", "555.80");
        Assert.Equal("99-E1 222.68", plate);
    }

    [Fact]
    public void ParseTwoLinePlate_fixes_from_corrected_prefix()
    {
        var plate = VietnamesePlateParser.ParseTwoLinePlate("99E1", "555.80");
        Assert.Equal("99-E1 222.68", plate);
    }
}
