namespace ParkingBuildingManagement.Api.Services;

/// <summary>
/// 4 tầng (2 xe máy 300/tầng, 2 ô tô 100/tầng). Mỗi tầng zone A–Z.
/// Khu E–I trên mỗi tầng = xe điện (xe máy điện / ô tô điện). Còn lại = xăng.
/// Mã zone: F1A…F1Z, F2A…F4Z. Slot: F1A1 (VIP), F1A2…
/// </summary>
public static class ParkingFloorCatalog
{
  public const char EvZoneStart = 'E';
  public const char EvZoneEnd = 'I';

  public sealed record ZoneTemplate(
      string Code,
      char ZoneLetter,
      string SectionName,
      int FloorNumber,
      string FloorLabel,
      int VehicleTypeId,
      int Capacity,
      int SortOrder,
      bool IsElectric);

  private static readonly (int Floor, string Label, bool IsMotorbike)[] Floors =
  [
      (1, "Tầng 1 - Xe máy", true),
      (2, "Tầng 2 - Xe máy", true),
      (3, "Tầng 3 - Ô tô", false),
      (4, "Tầng 4 - Ô tô", false),
  ];

  public static readonly ZoneTemplate[] Zones = BuildZones();

  private static readonly Dictionary<string, ZoneTemplate> ByCode =
      Zones.ToDictionary(z => z.Code, StringComparer.OrdinalIgnoreCase);

  public static int FloorCapacity(int floorNumber) => floorNumber is 1 or 2 ? 300 : 100;

  public static bool IsElectricZone(char letter) => letter >= EvZoneStart && letter <= EvZoneEnd;

  public static string ZoneDisplayName(ZoneTemplate template) =>
      $"{template.FloorLabel} - {template.SectionName}";

  public static int GetSortOrder(string zoneCode)
  {
    if (TryParseZoneCode(zoneCode, out var floor, out var letter))
      return floor * 100 + (letter - 'A');
    if (ByCode.TryGetValue(zoneCode, out var template)) return template.SortOrder;
    return 999;
  }

  public static int? GetFloorNumber(string zoneCode)
  {
    if (TryParseZoneCode(zoneCode, out var floor, out _)) return floor;
    if (ByCode.TryGetValue(zoneCode, out var template)) return template.FloorNumber;
    return null;
  }

  public static bool IsCatalogZoneCode(string zoneCode) => ByCode.ContainsKey(zoneCode);

  public static bool TryParseZoneCode(string zoneCode, out int floorNumber, out char zoneLetter)
  {
    floorNumber = 0;
    zoneLetter = '\0';
    if (string.IsNullOrWhiteSpace(zoneCode) || zoneCode.Length < 3) return false;
    if (zoneCode[0] != 'F' || !char.IsDigit(zoneCode[1])) return false;

    var digitEnd = 1;
    while (digitEnd < zoneCode.Length && char.IsDigit(zoneCode[digitEnd])) digitEnd++;
    if (digitEnd >= zoneCode.Length) return false;

    if (!int.TryParse(zoneCode[1..digitEnd], out floorNumber)) return false;

    zoneLetter = char.ToUpperInvariant(zoneCode[digitEnd]);
    return zoneLetter is >= 'A' and <= 'Z';
  }

  private static ZoneTemplate[] BuildZones()
  {
    var list = new List<ZoneTemplate>(Floors.Length * 26);

    foreach (var (floor, label, isMotorbike) in Floors)
    {
      for (var i = 0; i < 26; i++)
      {
        var letter = (char)('A' + i);
        var isEv = IsElectricZone(letter);
        var vehicleTypeId = isMotorbike
            ? (isEv ? 4 : 1)
            : (isEv ? 5 : 2);
        var code = $"F{floor}{letter}";
        var capacity = CapacityForZone(floor, i);
        list.Add(new ZoneTemplate(
            code,
            letter,
            $"Khu {letter}",
            floor,
            label,
            vehicleTypeId,
            capacity,
            floor * 100 + i,
            isEv));
      }
    }

    return list.ToArray();
  }

  private static int CapacityForZone(int floorNumber, int letterIndex)
  {
    var total = FloorCapacity(floorNumber);
    var baseCap = total / 26;
    var remainder = total % 26;
    return baseCap + (letterIndex < remainder ? 1 : 0);
  }
}
