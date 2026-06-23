using Microsoft.Extensions.Options;
using OpenCvSharp;
using Sdcb.PaddleInference;
using Sdcb.PaddleOCR;
using Sdcb.PaddleOCR.Models;
using Sdcb.PaddleOCR.Models.Local;
using Sdcb.PaddleOCR.Models.Online;

namespace ParkingBuildingManagement.Api.Services.Ocr;

public sealed class PaddlePlateOcrService(
    ILogger<PaddlePlateOcrService> logger,
    IOptions<PlateOcrOptions> options) : IPlateOcrService, IDisposable
{
    private readonly SemaphoreSlim _initLock = new(1, 1);
    private readonly SemaphoreSlim _ocrLock = new(1, 1);
    private PaddleOcrAll? _engine;
    private bool _initFailed;

    public bool IsAvailable => !_initFailed && _engine is not null;

    public async Task WarmUpAsync(CancellationToken cancellationToken = default)
    {
        _ = await GetEngineAsync(cancellationToken);
    }

    public async Task<PlateOcrResult> RecognizeAsync(Stream imageStream, CancellationToken cancellationToken = default)
    {
        var engine = await GetEngineAsync(cancellationToken);
        if (engine is null)
            return new PlateOcrResult(null, string.Empty, false);

        using var memory = new MemoryStream();
        await imageStream.CopyToAsync(memory, cancellationToken);
        var bytes = memory.ToArray();
        if (bytes.Length == 0)
            return new PlateOcrResult(null, string.Empty, true);

        using var source = Cv2.ImDecode(bytes, ImreadModes.Color);
        if (source.Empty())
            return new PlateOcrResult(null, string.Empty, true);

        await _ocrLock.WaitAsync(cancellationToken);
        try
        {
            return await Task.Run(() => RecognizeOnMat(engine, source), cancellationToken);
        }
        finally
        {
            _ocrLock.Release();
        }
    }

    private static PlateOcrResult RecognizeOnMat(PaddleOcrAll engine, Mat source)
    {
        OcrCandidate? best = null;
        var rawParts = new List<string>();

        foreach (var (mat, label) in PlateImagePreprocessor.BuildAttempts(source))
        {
            try
            {
                foreach (var candidate in RunAllStrategies(engine, mat, label))
                {
                    rawParts.Add(candidate.RawSnippet);
                    if (best is null || candidate.Score > best.Score)
                        best = candidate;
                }
            }
            finally
            {
                if (!ReferenceEquals(mat, source))
                    mat.Dispose();
            }
        }

        var rawText = rawParts.Count > 0 ? string.Join(" | ", rawParts.Distinct()) : string.Empty;
        return new PlateOcrResult(best?.Plate, rawText, true);
    }

    private static IEnumerable<OcrCandidate> RunAllStrategies(PaddleOcrAll engine, Mat mat, string label)
    {
        var split = TrySplitLineOcr(engine, mat, label);
        if (split is not null)
            yield return split;

        using var prepared = PlateImagePreprocessor.PrepareForOcr(mat, upscale: 2);
        var splitEnhanced = TrySplitLineOcr(engine, prepared, $"{label}-enh");
        if (splitEnhanced is not null)
            yield return splitEnhanced;

        var result = engine.Run(prepared);
        var lines = ExtractLines(result);
        var joined = string.Join(" / ", lines);
        if (string.IsNullOrWhiteSpace(joined))
            yield break;

        var confidence = AverageConfidence(result);
        var plate = VietnamesePlateParser.ParseFromOcrLines(lines)
            ?? VietnamesePlateParser.Parse(joined.Replace(" / ", " "));

        if (plate is not null)
        {
            yield return new OcrCandidate(
                plate,
                $"{label}:{joined}",
                ScorePlate(plate, confidence, splitLine: false));
        }
    }

    private static OcrCandidate? TrySplitLineOcr(PaddleOcrAll engine, Mat source, string label)
    {
        if (source.Height < 48) return null;

        var bottomY = (int)(source.Height * 0.52);
        var bottomH = Math.Max(32, source.Height - bottomY);
        using var top = new Mat(source, new Rect(0, 0, source.Width, Math.Max(32, (int)(source.Height * 0.46))));
        using var bottom = new Mat(source, new Rect(0, bottomY, source.Width, bottomH));

        var (topText, topConf) = RunSingleLineOcr(engine, top);
        var (bottomText, bottomConf) = RunSingleLineOcr(engine, bottom);
        if (string.IsNullOrWhiteSpace(topText) && string.IsNullOrWhiteSpace(bottomText))
            return null;

        var raw = $"{label}-split:{topText}/{bottomText}";
        var plate = VietnamesePlateParser.ParseTwoLinePlate(topText, bottomText)
            ?? VietnamesePlateParser.Parse($"{topText} {bottomText}");

        if (plate is null) return null;

        var confidence = (topConf + bottomConf) / 2f;
        return new OcrCandidate(plate, raw, ScorePlate(plate, confidence, splitLine: true));
    }

    private static (string Text, float Confidence) RunSingleLineOcr(PaddleOcrAll engine, Mat line)
    {
        using var prepared = PlateImagePreprocessor.PrepareForOcr(line, upscale: 3);
        var result = engine.Run(prepared);
        if (result.Regions.Length == 0)
            return (string.Empty, 0f);

        var ordered = result.Regions.OrderBy(r => r.Rect.Center.X).ToList();
        var text = string.Concat(ordered.Select(r => r.Text.Trim().ToUpperInvariant()));
        var confidence = ordered.Average(r => r.Score);
        return (text, confidence);
    }

    private static int ScorePlate(string plate, float ocrConfidence, bool splitLine)
    {
        var score = (int)(ocrConfidence * 40);
        if (splitLine) score += 20;
        if (plate.Contains('-') && plate.Contains('.')) score += 30;
        if (plate.Length is >= 10 and <= 14) score += 10;
        if (plate.Contains('-') && plate.Length >= 11 && char.IsDigit(plate[^3]) && plate[^6] == '.') score += 15;
        return score;
    }

    private static float AverageConfidence(PaddleOcrResult result) =>
        result.Regions.Length == 0 ? 0f : result.Regions.Average(r => r.Score);

    private async Task<PaddleOcrAll?> GetEngineAsync(CancellationToken cancellationToken)
    {
        if (_initFailed) return null;
        if (_engine is not null) return _engine;

        await _initLock.WaitAsync(cancellationToken);
        try
        {
            if (_initFailed) return null;
            if (_engine is not null) return _engine;

            var modelName = options.Value.Model;
            logger.LogInformation("Loading PaddleOCR {Model}...", modelName);

            _engine = await TryCreateEngineAsync(modelName, cancellationToken);
            if (_engine is null)
            {
                _initFailed = true;
                logger.LogError("PaddleOCR failed on all devices. Check OpenCvSharp runtime and Sdcb.PaddleInference packages.");
                return null;
            }

            logger.LogInformation("PaddleOCR {Model} ready.", modelName);
            return _engine;
        }
        catch (Exception ex)
        {
            _initFailed = true;
            logger.LogError(ex, "Failed to initialize PaddleOCR.");
            return null;
        }
        finally
        {
            _initLock.Release();
        }
    }

    private async Task<PaddleOcrAll?> TryCreateEngineAsync(string modelName, CancellationToken cancellationToken)
    {
        var local = TryCreateLocalEngine(modelName);
        if (local is not null) return local;

        logger.LogWarning(
            "Local PaddleOCR models unavailable — downloading {Model} online (one-time ~30–60s, then cached)...",
            modelName);

        try
        {
            var online = ResolveOnlineModel(modelName);
            var fullModel = await online.DownloadAsync(cancellationToken);
            return CreateEngine(fullModel);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Online PaddleOCR model download failed.");
            return null;
        }
    }

    private PaddleOcrAll? TryCreateLocalEngine(string modelName)
    {
        FullOcrModel model;
        try
        {
            model = ResolveLocalModel(modelName);
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "Local PaddleOCR model {Model} is not available.", modelName);
            return null;
        }

        return CreateEngine(model);
    }

    private PaddleOcrAll? CreateEngine(FullOcrModel model)
    {
        var devices = new (string Label, Action<PaddleConfig> Config)[]
        {
            ("Mkldnn", PaddleDevice.Mkldnn()),
            ("Blas", PaddleDevice.Blas()),
        };

        foreach (var (label, config) in devices)
        {
            try
            {
                logger.LogInformation("PaddleOCR trying device {Device}...", label);
                return new PaddleOcrAll(model, config)
                {
                    AllowRotateDetection = true,
                    Enable180Classification = false,
                };
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "PaddleOCR init failed on {Device}.", label);
            }
        }

        return null;
    }

    private static FullOcrModel ResolveLocalModel(string modelName) => modelName.ToUpperInvariant() switch
    {
        "CHINESEV5" or "CHINESE" => LocalFullModels.ChineseV5,
        _ => LocalFullModels.LatinV5,
    };

    private static OnlineFullModels ResolveOnlineModel(string modelName) => modelName.ToUpperInvariant() switch
    {
        "CHINESEV5" or "CHINESE" => OnlineFullModels.ChineseV5,
        "ENGLISHV5" or "ENGLISH" => OnlineFullModels.EnglishV5,
        _ => OnlineFullModels.LatinV5,
    };

    private static List<string> ExtractLines(PaddleOcrResult result)
    {
        if (result.Regions.Length == 0)
            return [];

        var ordered = result.Regions
            .Where(r => !string.IsNullOrWhiteSpace(r.Text))
            .OrderBy(r => r.Rect.Center.Y)
            .ThenBy(r => r.Rect.Center.X)
            .ToList();

        if (ordered.Count == 0)
            return [];

        var lines = new List<List<PaddleOcrResultRegion>> { new() { ordered[0] } };
        var lineThreshold = Math.Max(12, ordered[0].Rect.Size.Height * 0.6);

        for (var i = 1; i < ordered.Count; i++)
        {
            var region = ordered[i];
            var currentLine = lines[^1];
            var last = currentLine[^1];
            if (Math.Abs(region.Rect.Center.Y - last.Rect.Center.Y) <= lineThreshold)
                currentLine.Add(region);
            else
                lines.Add(new() { region });
        }

        return lines
            .Select(line => string.Join("", line.Select(r => r.Text.Trim().ToUpperInvariant())))
            .Where(text => !string.IsNullOrWhiteSpace(text))
            .ToList();
    }

    public void Dispose()
    {
        _engine?.Dispose();
        _initLock.Dispose();
        _ocrLock.Dispose();
    }

    private sealed record OcrCandidate(string? Plate, string RawSnippet, int Score);
}
