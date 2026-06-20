using System.Net;
using System.Net.Http.Json;
using ParkingBuildingManagement.Api.Common;

namespace ParkingBuildingManagement.Api.Tests;

public class TicketCodeGeneratorTests
{
    [Fact]
    public void Generate_ReturnsPbmsPrefixAndDate()
    {
        var code = TicketCodeGenerator.Generate();

        Assert.StartsWith("PBMS-", code);
        Assert.Contains(DateTime.UtcNow.ToString("yyyyMMdd"), code);
    }

    [Fact]
    public void Generate_ProducesUniqueCodes()
    {
        var codes = Enumerable.Range(0, 20).Select(_ => TicketCodeGenerator.Generate()).ToList();
        Assert.Equal(codes.Count, codes.Distinct().Count());
    }
}
