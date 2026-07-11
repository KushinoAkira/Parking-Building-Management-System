using Google.Apis.Auth;
using ParkingBuildingManagement.Api.Common;

namespace ParkingBuildingManagement.Api.Services;

public record GoogleIdentity(string Subject, string Email, string FullName, bool EmailVerified);

public interface IGoogleTokenValidator
{
    Task<GoogleIdentity> ValidateAsync(string idToken, CancellationToken ct);
}

public class GoogleTokenValidator(IConfiguration config) : IGoogleTokenValidator
{
    public async Task<GoogleIdentity> ValidateAsync(string idToken, CancellationToken ct)
    {
        var clientId = config["Google:ClientId"]?.Trim();
        if (string.IsNullOrWhiteSpace(clientId) || clientId.StartsWith("your_", StringComparison.OrdinalIgnoreCase))
            throw new BusinessException("Google sign-in is not configured.", 503);

        try
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(
                idToken,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = [clientId],
                });

            if (string.IsNullOrWhiteSpace(payload.Subject))
                throw new BusinessException("Invalid Google token.", 401);

            if (string.IsNullOrWhiteSpace(payload.Email))
                throw new BusinessException("Google account has no email.", 400);

            if (!payload.EmailVerified)
                throw new BusinessException("Google email is not verified.", 400);

            var name = string.IsNullOrWhiteSpace(payload.Name)
                ? payload.Email.Split('@')[0]
                : payload.Name.Trim();

            return new GoogleIdentity(
                payload.Subject,
                payload.Email.Trim().ToLowerInvariant(),
                name,
                payload.EmailVerified);
        }
        catch (BusinessException)
        {
            throw;
        }
        catch (InvalidJwtException)
        {
            throw new BusinessException("Invalid Google token.", 401);
        }
        catch (Exception)
        {
            throw new BusinessException("Google token validation failed.", 401);
        }
    }
}
