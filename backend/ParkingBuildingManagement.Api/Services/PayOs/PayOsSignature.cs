using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace ParkingBuildingManagement.Api.Services.PayOs;

public static class PayOsSignature
{
    public static string Sign(IReadOnlyDictionary<string, string> data, string checksumKey)
    {
        var sorted = data.OrderBy(kv => kv.Key, StringComparer.Ordinal)
            .Select(kv => $"{kv.Key}={kv.Value}");
        var raw = string.Join("&", sorted);
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(checksumKey));
        return Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(raw))).ToLowerInvariant();
    }

    public static bool Verify(string signature, IReadOnlyDictionary<string, string> data, string checksumKey) =>
        string.Equals(Sign(data, checksumKey), signature, StringComparison.OrdinalIgnoreCase);

    public static IReadOnlyDictionary<string, string> FlattenJsonElement(JsonElement element)
    {
        var result = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (var prop in element.EnumerateObject())
        {
            if (prop.Value.ValueKind == JsonValueKind.Object)
            {
                foreach (var nested in FlattenJsonElement(prop.Value))
                    result[nested.Key] = nested.Value;
            }
            else if (prop.Value.ValueKind != JsonValueKind.Null)
            {
                result[prop.Name] = prop.Value.ToString();
            }
        }
        return result;
    }
}
