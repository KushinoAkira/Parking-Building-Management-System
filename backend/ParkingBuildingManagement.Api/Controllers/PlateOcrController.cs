using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ParkingBuildingManagement.Api.Common;
using ParkingBuildingManagement.Api.Services.Ocr;

namespace ParkingBuildingManagement.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.StaffOrAbove)]
[EnableRateLimiting("ocr")]
[Route("api/ocr")]
public class PlateOcrController(IPlateOcrService ocr) : ControllerBase
{
    [HttpGet("ready")]
    public async Task<IActionResult> Ready(CancellationToken cancellationToken)
    {
        await ocr.WarmUpAsync(cancellationToken);
        return Ok(new
        {
            ready = ocr.IsAvailable,
            available = ocr.IsAvailable,
            fallback = ocr.IsAvailable ? null : "browser-alpr",
            hint = ocr.IsAvailable
                ? null
                : "Server OCR unavailable on Linux. Use browser Tesseract or Plate Recognizer (VITE_PLATE_RECOGNIZER_TOKEN).",
        });
    }

    [HttpPost("plate")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> RecognizePlate(IFormFile? image, CancellationToken cancellationToken)
    {
        if (image is null || image.Length == 0)
            return BadRequest(new { error = "Image is required." });

        if (!image.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "File must be an image." });

        await using var stream = image.OpenReadStream();
        var result = await ocr.RecognizeAsync(stream, cancellationToken);

        if (!result.Available)
            return StatusCode(503, new
            {
                error = "OCR engine is unavailable on this server.",
                fallback = "browser-alpr",
                hint = "Use browser scan (Tesseract) or configure VITE_PLATE_RECOGNIZER_TOKEN on the frontend.",
            });

        return Ok(new
        {
            plate = result.Plate,
            rawText = result.RawText,
            available = result.Available,
        });
    }
}
