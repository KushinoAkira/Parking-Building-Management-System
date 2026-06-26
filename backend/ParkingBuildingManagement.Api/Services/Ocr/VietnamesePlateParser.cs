using System.Text.RegularExpressions;

namespace ParkingBuildingManagement.Api.Services.Ocr;

public static partial class VietnamesePlateParser
{
    public static string? Parse(string raw)
    {
        var trimmed = raw.Trim();
        if (string.IsNullOrEmpty(trimmed)) return null;

        var newPlate = ParseNewMotorcyclePlate(trimmed);
        if (newPlate is not null) return newPlate;

        var spaceParts = Regex.Split(trimmed, @"[\s|/\n\r]+")
            .Where(p => !string.IsNullOrWhiteSpace(p))
            .ToArray();

        if (spaceParts.Length >= 2)
        {
            var top = spaceParts[0];
            var bottom = spaceParts.Length >= 3
                && Regex.IsMatch(spaceParts[1], @"^\d+$")
                && Regex.IsMatch(spaceParts[2], @"^\d+$")
                ? $"{spaceParts[1]}.{spaceParts[2]}"
                : string.Concat(spaceParts.Skip(1));

            var twoLine = ParseTwoLinePlate(top, bottom);
            if (twoLine is not null) return twoLine;
        }

        var compact = NormalizeOcrText(trimmed.Replace(',', '.'));
        if (string.IsNullOrEmpty(compact)) return null;

        newPlate = ParseNewMotorcyclePlate(compact);
        if (newPlate is not null) return newPlate;

        var motorcycle = MotorcycleDotPattern().Match(compact);
        if (motorcycle.Success)
            return FormatPlate($"{motorcycle.Groups[1].Value}{motorcycle.Groups[2].Value}", motorcycle.Groups[3].Value, motorcycle.Groups[4].Value);

        var exact = ExactPattern().Match(compact);
        if (exact.Success)
            return FormatPlate(exact.Groups[1].Value, exact.Groups[2].Value, exact.Groups[3].Value);

        var compact7 = Compact7Pattern().Match(compact);
        if (compact7.Success)
            return FormatPlate($"{compact7.Groups[1].Value}{compact7.Groups[2].Value}", compact7.Groups[3].Value);

        var compact8 = Compact8Pattern().Match(compact);
        if (compact8.Success && compact.Length == 9)
            return FormatPlate($"{compact8.Groups[1].Value}{compact8.Groups[2].Value}{compact8.Groups[3].Value}", compact8.Groups[4].Value);

        var fourDigit = FourDigitPattern().Match(compact);
        if (fourDigit.Success)
            return FormatPlate($"{fourDigit.Groups[1].Value}{fourDigit.Groups[2].Value}", fourDigit.Groups[3].Value);

        var embedded = EmbeddedPattern().Match(compact);
        if (embedded.Success)
            return TryFormatWithPrefixAlternatives($"{embedded.Groups[1].Value}{embedded.Groups[2].Value}", $"{embedded.Groups[3].Value}.{embedded.Groups[4].Value}");

        return null;
    }

    public static string? ParseTwoLinePlate(string topRaw, string bottomRaw)
    {
        var prefix = ExtractPrefix(topRaw);
        if (prefix is null)
        {
            var fixedTop = FixPrefixConfusions(topRaw);
            prefix = ExtractPrefix(fixedTop) ?? fixedTop.Replace("-", "").ToUpperInvariant();
            if (prefix.Length < 4) return null;
        }
        return TryFormatWithPrefixAlternatives(prefix, bottomRaw);
    }

    public static string? ParseFromOcrLines(IReadOnlyList<string> lines)
    {
        if (lines.Count == 0) return null;

        var joined = string.Join(" ", lines);
        var plate = Parse(joined);
        if (plate is not null) return plate;

        if (lines.Count >= 2)
        {
            plate = ParseTwoLinePlate(lines[0], lines[1]);
            if (plate is not null) return plate;

            plate = ParseTwoLinePlate(lines[0], string.Concat(lines.Skip(1)));
            if (plate is not null) return plate;
        }

        foreach (var line in lines)
        {
            plate = Parse(line);
            if (plate is not null) return plate;
        }

        return Parse(joined.Replace(" ", ""));
    }

    private static string? ParseNewMotorcyclePlate(string raw)
    {
        var compact = NormalizeOcrText(raw.Replace(',', '.'));

        var tight = TightNewPattern().Match(compact);
        if (tight.Success)
            return TryFormatWithPrefixAlternatives($"{tight.Groups[1].Value}{tight.Groups[2].Value}", $"{tight.Groups[3].Value}.{tight.Groups[4].Value}");

        var tightNoDot = TightNewNoDotPattern().Match(compact);
        if (tightNoDot.Success)
            return TryFormatWithPrefixAlternatives($"{tightNoDot.Groups[1].Value}{tightNoDot.Groups[2].Value}", tightNoDot.Groups[3].Value);

        var embedded = EmbeddedNewPattern().Match(compact);
        if (embedded.Success)
            return TryFormatWithPrefixAlternatives($"{embedded.Groups[1].Value}{embedded.Groups[2].Value}", $"{embedded.Groups[3].Value}.{embedded.Groups[4].Value}");

        var embeddedNoDot = EmbeddedNewNoDotPattern().Match(compact);
        if (embeddedNoDot.Success)
            return TryFormatWithPrefixAlternatives($"{embeddedNoDot.Groups[1].Value}{embeddedNoDot.Groups[2].Value}", embeddedNoDot.Groups[3].Value);

        return null;
    }

    private static string? TryFormatWithPrefixAlternatives(string prefix, string bottomRaw)
    {
        var bottomFormatted = ExtractBottomDigits(bottomRaw);
        if (bottomFormatted is null) return null;

        var rawPrefix = prefix.Replace("-", "").ToUpperInvariant();
        var rawBottom = bottomFormatted;

        if (!LooksLikeOcrNoise(rawPrefix, rawBottom))
        {
            foreach (var altPrefix in PrefixAlternatives(prefix))
            {
                var plate = FormatFromBottom(altPrefix, bottomFormatted);
                if (plate is not null) return plate;
            }
            return FormatFromBottom(rawPrefix, bottomFormatted);
        }

        string? bestPlate = null;
        var bestScore = -1;
        var bestSeriesScore = -1;

        foreach (var altPrefix in ExpandPrefixOcrVariants(FixPrefixConfusions(prefix)))
        {
            foreach (var altBottom in BottomDigitAlternatives(bottomFormatted))
            {
                if (bottomFormatted.Contains('.') && !TwoLetterSeriesPattern().IsMatch(altPrefix))
                    continue;

                var plate = FormatFromBottom(altPrefix, altBottom);
                if (plate is null) continue;

                var score = (altPrefix != rawPrefix ? 1 : 0) + (altBottom != rawBottom ? 1 : 0);
                var seriesScore = SeriesCorrectionScore(rawPrefix, altPrefix);
                if (bottomFormatted.Contains('.') && !TwoLetterSeriesPattern().IsMatch(altPrefix))
                    seriesScore -= 10;
                var bottomScore = BottomCorrectionScore(rawBottom, altBottom);
                var formatScore = plate.Contains('-') && plate.Contains('.') ? 3 : 0;
                var total = score + seriesScore + bottomScore + formatScore;
                if (total > bestScore || (total == bestScore && seriesScore + bottomScore > bestSeriesScore))
                {
                    bestPlate = plate;
                    bestScore = total;
                    bestSeriesScore = seriesScore + bottomScore;
                }
            }
        }

        return bestPlate ?? FormatFromBottom(rawPrefix, bottomFormatted);
    }

    private static int SeriesCorrectionScore(string rawPrefix, string altPrefix)
    {
        var score = 0;
        if (rawPrefix.Length >= 4 && altPrefix.Length >= 4 && rawPrefix[3] == 'J' && altPrefix[3] == '1')
            score += 3;
        if (TwoLetterSeriesPattern().IsMatch(altPrefix))
            score += 4;
        if (rawPrefix.Contains('E', StringComparison.Ordinal) && altPrefix.EndsWith("E1", StringComparison.Ordinal))
            score += 5;
        if (rawPrefix.Contains('J', StringComparison.Ordinal) && altPrefix.EndsWith("E1", StringComparison.Ordinal))
            score += 5;
        if (rawPrefix.Length >= 3 && altPrefix.Length >= 3 && rawPrefix[2] == 'L' && altPrefix[2] == 'B')
            score += 2;
        if (rawPrefix.Length >= 4 && altPrefix.Length >= 4 && rawPrefix[3] == '4' && altPrefix[3] == '1')
            score += 2;
        if (rawPrefix.Length >= 2 && altPrefix.Length >= 2 && rawPrefix[1] == '4' && altPrefix[1] == '7')
            score += 2;
        if (rawPrefix.Length >= 4 && altPrefix.Length >= 4 && rawPrefix[3] == '8' && altPrefix[3] == 'B')
            score += 1;
        return score;
    }

    private static int BottomCorrectionScore(string rawBottom, string altBottom)
    {
        var score = 0;
        if (rawBottom.Length >= 2 && rawBottom.StartsWith("52", StringComparison.Ordinal)
            && altBottom.Length >= 2 && altBottom.StartsWith("25", StringComparison.Ordinal))
            score += 3;
        if (rawBottom.StartsWith("555", StringComparison.Ordinal) && altBottom.StartsWith("222", StringComparison.Ordinal))
            score += 4;
        if (rawBottom.EndsWith(".80", StringComparison.Ordinal) && altBottom.EndsWith(".68", StringComparison.Ordinal))
            score += 3;
        if (rawBottom.Count(c => c == '5') >= 2 && altBottom.Count(c => c == '5') < rawBottom.Count(c => c == '5'))
            score += 2;
        return score;
    }

    private static string? FormatFromBottom(string altPrefix, string bottomFormatted)
    {
        var hasDot = bottomFormatted.Contains('.');
        var parts = bottomFormatted.Split('.');
        var main = hasDot ? parts[0] : bottomFormatted[..3];
        var suffix = hasDot ? parts[1] : bottomFormatted[3..];
        return hasDot ? FormatPlate(altPrefix, main, suffix) : FormatPlate(altPrefix, bottomFormatted);
    }

    private static bool LooksLikeOcrNoise(string rawPrefix, string rawBottom)
    {
        if (rawPrefix.Contains('L', StringComparison.Ordinal)) return true;
        if (rawPrefix.Contains('J', StringComparison.Ordinal)) return true;
        if (rawPrefix.Length >= 2 && rawPrefix[1] == '4') return true;
        if (rawPrefix.Length >= 4 && char.IsLetter(rawPrefix[2]) && !char.IsDigit(rawPrefix[3])) return true;
        if (rawBottom.Count(c => c == '5') >= 2) return true;
        if (rawBottom.Length >= 3 && rawBottom[0] == '5' && rawBottom[1] == '2') return true;
        if (rawPrefix.Length >= 4 && rawPrefix[3] is '4' or '8') return true;
        return false;
    }

    private static IEnumerable<string> ExpandPrefixOcrVariants(string prefix)
    {
        var seen = new HashSet<string>(StringComparer.Ordinal);
        var queue = new Queue<string>();

        void Enqueue(string value)
        {
            var clean = value.Replace("-", "").ToUpperInvariant();
            if (seen.Add(clean)) queue.Enqueue(clean);
        }

        Enqueue(FixPrefixConfusions(prefix));
        foreach (var alt in PrefixAlternatives(prefix))
            Enqueue(alt);

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            yield return current;

            if (current.Length >= 2)
            {
                var d1 = current[1];
                if (d1 == '4') Enqueue(current[0] + "7" + current[2..]);
                if (d1 == '7') Enqueue(current[0] + "4" + current[2..]);
                if (d1 == '1') Enqueue(current[0] + "7" + current[2..]);
            }

            if (current.Length >= 3 && char.IsLetter(current[2]))
            {
                if (current[2] == 'L') Enqueue(current[..2] + "B" + current[3..]);
                if (current[2] == 'B') Enqueue(current[..2] + "L" + current[3..]);
                if (current[2] == 'I') Enqueue(current[..2] + "1" + current[3..]);
            }

            if (current.Length >= 4)
            {
                var d = current[3];
                if (d == 'J') Enqueue(current[..3] + "1");
                if (d == '4') { Enqueue(current[..3] + "1"); Enqueue(current[..3] + "8"); }
                if (d == '1') { Enqueue(current[..3] + "4"); Enqueue(current[..3] + "8"); }
                if (d == '8') { Enqueue(current[..3] + "B"); Enqueue(current[..3] + "1"); }
            }
        }
    }

    private static IEnumerable<string> BottomDigitAlternatives(string bottomFormatted)
    {
        var seen = new HashSet<string>(StringComparer.Ordinal) { bottomFormatted };
        yield return bottomFormatted;

        if (!bottomFormatted.Contains('.')) yield break;

        var parts = bottomFormatted.Split('.');
        if (parts[0].Length != 3 || parts[1].Length != 2) yield break;

        foreach (var main in DigitSegmentVariants(parts[0]))
        foreach (var suffix in DigitSegmentVariants(parts[1]))
        {
            var formatted = $"{main}.{suffix}";
            if (seen.Add(formatted))
                yield return formatted;
        }
    }

    private static IEnumerable<string> DigitSegmentVariants(string segment)
    {
        var results = new HashSet<string>(StringComparer.Ordinal) { segment };
        var queue = new Queue<string>();
        queue.Enqueue(segment);

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            yield return current;

            for (var i = 0; i < current.Length; i++)
            {
                var sub = SubstituteDigit(current[i]);
                if (sub == current[i]) continue;
                var mutated = current[..i] + sub + current[(i + 1)..];
                if (results.Add(mutated))
                    queue.Enqueue(mutated);
            }
        }
    }

    private static char SubstituteDigit(char d) => d switch
    {
        '5' => '2',
        '2' => '5',
        '8' => '6',
        '6' => '8',
        '0' => '8',
        '3' => '8',
        '4' => '1',
        '1' => '4',
        _ => d,
    };

    private static string? FormatPlate(string prefix, string digits, string? suffix = null)
    {
        var p = FixPrefixConfusions(prefix).Replace("-", "");
        if (!PrefixPattern().IsMatch(p)) return null;

        var province = int.Parse(p[..2]);
        if (province is < 11 or > 99) return null;

        var displayPrefix = FormatDisplayPrefix(p);

        if (suffix is not null && DigitPairPattern().IsMatch(suffix))
        {
            var main = FixDigitConfusions(digits).Replace(".", "");
            if (main.Length >= 3)
                return $"{displayPrefix} {main[..3]}.{suffix}";
            return null;
        }

        var nums = FixDigitConfusions(digits).Replace(".", "");
        if (nums.Length >= 5)
            return $"{displayPrefix} {nums[..3]}.{nums[3..5]}";
        if (nums.Length == 4)
            return $"{displayPrefix} {nums}";

        return null;
    }

    private static IEnumerable<string> PrefixAlternatives(string prefix)
    {
        var clean = prefix.Replace("-", "").ToUpperInvariant();
        var alts = new HashSet<string>(StringComparer.Ordinal) { clean };

        if (clean.StartsWith("00", StringComparison.Ordinal))
        {
            alts.Add($"99{clean[2..]}");
            alts.Add($"90{clean[2..]}");
        }

        if (clean.Length >= 2 && clean[0] == '0' && char.IsDigit(clean[1]))
            alts.Add($"9{clean[1..]}");

        if (clean.StartsWith("88", StringComparison.Ordinal))
            alts.Add($"99{clean[2..]}");

        if (EightSeriesPattern().IsMatch(clean))
            alts.Add($"{clean[..2]}B{clean[3]}");

        if (BSeriesPattern().IsMatch(clean))
            alts.Add($"{clean[..2]}8{clean[3]}");

        return alts;
    }

    private static string? ExtractPrefix(string raw)
    {
        var top = FixPrefixConfusions(raw);

        var strict = StrictPrefixPattern().Match(top);
        if (strict.Success)
        {
            if (strict.Groups[2].Success && char.IsLetter(strict.Groups[2].Value[0]))
                return strict.Groups[3].Success
                    ? $"{strict.Groups[1].Value}{strict.Groups[2].Value}{strict.Groups[3].Value}"
                    : $"{strict.Groups[1].Value}{strict.Groups[2].Value}";
            return strict.Groups[1].Value;
        }

        var loose = LoosePrefixPattern().Match(top);
        if (!loose.Success) return null;

        return loose.Groups[3].Success
            ? $"{loose.Groups[1].Value}{loose.Groups[2].Value}{loose.Groups[3].Value}"
            : $"{loose.Groups[1].Value}{loose.Groups[2].Value}";
    }

    private static string? ExtractBottomDigits(string raw)
    {
        var bottom = FixDigitConfusions(raw);
        var dot = DotDigitsPattern().Match(bottom);
        if (dot.Success)
            return $"{dot.Groups[1].Value}.{dot.Groups[2].Value}";

        var digits = Regex.Replace(bottom, @"[^\d]", "");
        if (digits.Length >= 5)
            return $"{digits[..3]}.{digits[^2..]}";
        if (digits.Length == 4)
            return digits;

        return null;
    }

    private static string FormatDisplayPrefix(string p)
    {
        var clean = p.Replace("-", "");
        if (TwoLetterSeriesPattern().IsMatch(clean))
            return $"{clean[..2]}-{clean[2..]}";
        return clean;
    }

    private static string FixPrefixConfusions(string raw)
    {
        var text = raw.ToUpperInvariant().Replace(" ", "");
        text = NonPrefixChars().Replace(text, "");
        text = LeadingR().Replace(text, m => $"9{m.Groups[1].Value}");
        text = MiddleR().Replace(text, m => $"{m.Groups[1].Value}9{m.Groups[2].Value}");
        text = LetterOBeforeDigit().Replace(text, "0");
        text = LetterIBeforeDigit().Replace(text, "1");
        text = LetterJAfterSeries().Replace(text, "${1}1");
        text = DigitDashEightDigit().Replace(text, m => $"{m.Groups[1].Value}-B{m.Groups[2].Value}");
        return text;
    }

    private static string FixDigitConfusions(string raw)
    {
        var text = raw.ToUpperInvariant().Replace(" ", "").Replace(',', '.');
        text = text.Replace('O', '0').Replace('I', '1').Replace('L', '1').Replace('S', '5').Replace('Z', '2').Replace('G', '6');
        return NonDigitDot().Replace(text, "");
    }

    private static string NormalizeOcrText(string raw) =>
        NonPlateChars().Replace(raw.ToUpperInvariant().Replace(" ", ""), "");

    [GeneratedRegex(@"^\d{2}[A-Z]{1,2}\d?$")]
    private static partial Regex PrefixPattern();

    [GeneratedRegex(@"^\d{2}$")]
    private static partial Regex DigitPairPattern();

    [GeneratedRegex(@"^\d{2}8\d$")]
    private static partial Regex EightSeriesPattern();

    [GeneratedRegex(@"^\d{2}B\d$")]
    private static partial Regex BSeriesPattern();

    [GeneratedRegex(@"^(\d{2})[-]?([A-Z]{1,2})(\d)?$")]
    private static partial Regex StrictPrefixPattern();

    [GeneratedRegex(@"(\d{2})[-]?([A-Z]{1,2})(\d)?")]
    private static partial Regex LoosePrefixPattern();

    [GeneratedRegex(@"(\d{3})\.(\d{2})")]
    private static partial Regex DotDigitsPattern();

    [GeneratedRegex(@"^\d{2}[A-Z]\d$")]
    private static partial Regex TwoLetterSeriesPattern();

    [GeneratedRegex(@"^(\d{2})[-]?([A-Z]\d)(\d{3})\.(\d{2})$")]
    private static partial Regex TightNewPattern();

    [GeneratedRegex(@"^(\d{2})[-]?([A-Z]\d)(\d{5})$")]
    private static partial Regex TightNewNoDotPattern();

    [GeneratedRegex(@"(\d{2})[-]?([A-Z]\d)[^\d]*(\d{3})\.(\d{2})")]
    private static partial Regex EmbeddedNewPattern();

    [GeneratedRegex(@"(\d{2})[-]?([A-Z]\d)[^\d]*(\d{5})")]
    private static partial Regex EmbeddedNewNoDotPattern();

    [GeneratedRegex(@"^(\d{2})[-]?([A-Z]\d?)[-.]?(\d{3})[.](\d{2})$")]
    private static partial Regex MotorcycleDotPattern();

    [GeneratedRegex(@"^(\d{2}[A-Z]{1,2})[-.]?(\d{3})[.](\d{2})$")]
    private static partial Regex ExactPattern();

    [GeneratedRegex(@"^(\d{2})([A-Z]{1,2})(\d{5})$")]
    private static partial Regex Compact7Pattern();

    [GeneratedRegex(@"^(\d{2})([A-Z])(\d)(\d{5})$")]
    private static partial Regex Compact8Pattern();

    [GeneratedRegex(@"^(\d{2})[-]?([A-Z]\d)[-.]?(\d{4})$")]
    private static partial Regex FourDigitPattern();

    [GeneratedRegex(@"(\d{2})[-]?([A-Z]{1,2}\d?)[-.]?(\d{3})[.](\d{2})")]
    private static partial Regex EmbeddedPattern();

    [GeneratedRegex(@"[^0-9A-Z\-]")]
    private static partial Regex NonPrefixChars();

    [GeneratedRegex(@"[^0-9.]")]
    private static partial Regex NonDigitDot();

    [GeneratedRegex(@"[^0-9A-Z.\-]")]
    private static partial Regex NonPlateChars();

    [GeneratedRegex(@"^R(\d)")]
    private static partial Regex LeadingR();

    [GeneratedRegex(@"(\d)R(\d)")]
    private static partial Regex MiddleR();

    [GeneratedRegex(@"O(?=\d)")]
    private static partial Regex LetterOBeforeDigit();

    [GeneratedRegex(@"I(?=\d)")]
    private static partial Regex LetterIBeforeDigit();

    [GeneratedRegex(@"([A-Z])J")]
    private static partial Regex LetterJAfterSeries();

    [GeneratedRegex(@"(\d)-8(\d)")]
    private static partial Regex DigitDashEightDigit();
}
