using Microsoft.EntityFrameworkCore.Infrastructure;

namespace ParkingBuildingManagement.Api.Common;

public static class DatabaseExtensions
{
    public static bool SupportsTransactions(this DatabaseFacade database) =>
        database.ProviderName is not null &&
        !database.ProviderName.Contains("InMemory", StringComparison.Ordinal);
}
