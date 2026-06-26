using OpenCvSharp;

namespace ParkingBuildingManagement.Api.Services.Ocr;

internal static class PlateImagePreprocessor
{
    internal static IEnumerable<(Mat Mat, string Label)> BuildAttempts(Mat source)
    {
        yield return (source, "original");

        var plateCrop = TryCropPlateRegion(source);
        if (plateCrop is not null)
            yield return (plateCrop, "detect");

        var brightCrop = TryCropBrightPlate(source);
        if (brightCrop is not null)
            yield return (brightCrop, "bright");

        using var center = CropCenter(source, 0.72);
        if (!center.Empty())
            yield return (center.Clone(), "crop");

        using var inverted = InvertIfDark(source);
        if (!inverted.Empty())
            yield return (inverted.Clone(), "invert");
    }

    internal static Mat PrepareForOcr(Mat source, int upscale = 1)
    {
        const int minWidth = 720;
        const int maxWidth = 1920;

        using var enhanced = EnhanceContrast(source);
        var width = enhanced.Width;
        var height = enhanced.Height;
        var targetWidth = width * upscale;

        if (targetWidth < minWidth)
            targetWidth = minWidth;
        else if (targetWidth > maxWidth)
            targetWidth = maxWidth;

        if (targetWidth == width && upscale == 1)
            return enhanced.Clone();

        var scale = (double)targetWidth / width;
        var targetHeight = Math.Max(32, (int)Math.Round(height * scale));
        var resized = new Mat();
        Cv2.Resize(enhanced, resized, new Size(targetWidth, targetHeight), 0, 0, InterpolationFlags.Cubic);
        return resized;
    }

    private static Mat? TryCropPlateRegion(Mat source)
    {
        using var gray = new Mat();
        Cv2.CvtColor(source, gray, ColorConversionCodes.BGR2GRAY);
        using var blur = new Mat();
        Cv2.GaussianBlur(gray, blur, new Size(5, 5), 0);
        using var binary = new Mat();
        Cv2.AdaptiveThreshold(blur, binary, 255, AdaptiveThresholdTypes.GaussianC, ThresholdTypes.Binary, 11, 2);

        Cv2.FindContours(binary, out var contours, out _, RetrievalModes.External, ContourApproximationModes.ApproxSimple);

        var imgArea = source.Width * source.Height;
        Rect? best = null;
        var bestArea = 0.0;

        foreach (var contour in contours)
        {
            var rect = Cv2.BoundingRect(contour);
            var area = rect.Width * (double)rect.Height;
            if (area < imgArea * 0.04 || area > imgArea * 0.92) continue;

            var aspect = rect.Width / (double)Math.Max(1, rect.Height);
            if (aspect < 1.2 || aspect > 7.5) continue;

            if (area > bestArea)
            {
                bestArea = area;
                best = rect;
            }
        }

        if (best is null) return null;
        return new Mat(source, ExpandRect(best.Value, source.Width, source.Height, 0.04));
    }

    private static Mat? TryCropBrightPlate(Mat source)
    {
        using var gray = new Mat();
        Cv2.CvtColor(source, gray, ColorConversionCodes.BGR2GRAY);
        using var bright = new Mat();
        Cv2.Threshold(gray, bright, 185, 255, ThresholdTypes.Binary);

        Cv2.FindContours(bright, out var contours, out _, RetrievalModes.External, ContourApproximationModes.ApproxSimple);

        var imgArea = source.Width * source.Height;
        Rect? best = null;
        var bestArea = 0.0;

        foreach (var contour in contours)
        {
            var rect = Cv2.BoundingRect(contour);
            var area = rect.Width * (double)rect.Height;
            if (area < imgArea * 0.01 || area > imgArea * 0.55) continue;

            var aspect = rect.Width / (double)Math.Max(1, rect.Height);
            if (aspect < 1.5 || aspect > 6.5) continue;

            if (area > bestArea)
            {
                bestArea = area;
                best = rect;
            }
        }

        if (best is null) return null;
        return new Mat(source, ExpandRect(best.Value, source.Width, source.Height, 0.06));
    }

    private static Rect ExpandRect(Rect rect, int maxW, int maxH, double padRatio)
    {
        var padX = (int)(rect.Width * padRatio);
        var padY = (int)(rect.Height * padRatio);
        var x = Math.Max(0, rect.X - padX);
        var y = Math.Max(0, rect.Y - padY);
        var w = Math.Min(maxW - x, rect.Width + padX * 2);
        var h = Math.Min(maxH - y, rect.Height + padY * 2);
        return new Rect(x, y, Math.Max(32, w), Math.Max(32, h));
    }

    private static Mat EnhanceContrast(Mat source)
    {
        using var gray = new Mat();
        Cv2.CvtColor(source, gray, ColorConversionCodes.BGR2GRAY);
        using var clahe = Cv2.CreateCLAHE(2.5, new Size(8, 8));
        using var enhanced = new Mat();
        clahe.Apply(gray, enhanced);
        var output = new Mat();
        Cv2.CvtColor(enhanced, output, ColorConversionCodes.GRAY2BGR);
        return output;
    }

    private static Mat CropCenter(Mat source, double ratio)
    {
        var cropW = Math.Max(32, (int)Math.Round(source.Width * ratio));
        var cropH = Math.Max(32, (int)Math.Round(source.Height * ratio));
        var x = Math.Max(0, (source.Width - cropW) / 2);
        var y = Math.Max(0, (source.Height - cropH) / 2);
        return new Mat(source, new Rect(x, y, cropW, cropH));
    }

    private static Mat InvertIfDark(Mat source)
    {
        using var gray = new Mat();
        Cv2.CvtColor(source, gray, ColorConversionCodes.BGR2GRAY);
        if (Cv2.Mean(gray).Val0 >= 110)
            return new Mat();

        var inverted = new Mat();
        Cv2.BitwiseNot(source, inverted);
        return inverted;
    }
}
