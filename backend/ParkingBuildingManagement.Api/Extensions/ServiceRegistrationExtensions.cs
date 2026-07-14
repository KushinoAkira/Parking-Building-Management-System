using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Services;
using ParkingBuildingManagement.Api.Services.Ocr;
using ParkingBuildingManagement.Api.Services.PayOs;

namespace ParkingBuildingManagement.Api.Extensions;

public static class ServiceRegistrationExtensions
{
    public static IServiceCollection AddPbmsData(this IServiceCollection services, IConfiguration config, bool isTesting)
    {
        if (isTesting)
        {
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("PbmsIntegrationTests"));
            return services;
        }

        var connectionString = DatabaseConnection.Resolve(config);
        services.AddDbContext<ApplicationDbContext>(options => options.UseNpgsql(connectionString));
        return services;
    }

    public static IServiceCollection AddPbmsCoreServices(this IServiceCollection services, bool isTesting = false)
    {
        services.AddScoped<IParkingRealtimeNotifier, ParkingRealtimeNotifier>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IGoogleTokenValidator, GoogleTokenValidator>();
        services.AddScoped<ISlotAllocationService, SlotAllocationService>();
        services.AddScoped<IPricingService, PricingService>();
        services.AddScoped<IParkingSessionService, ParkingSessionService>();
        services.AddScoped<IReservationService, ReservationService>();
        services.AddScoped<IDatabaseSeeder, DatabaseSeeder>();
        services.AddScoped<IWalletService, WalletService>();
        services.AddScoped<IReportSnapshotService, ReportSnapshotService>();
        services.AddScoped<ISubscriptionPlanService, SubscriptionPlanService>();
        services.AddScoped<ISubscriptionService, SubscriptionService>();

        if (!isTesting)
        {
            services.AddHostedService<ReservationExpiryHostedService>();
            services.AddHostedService<SubscriptionExpiryHostedService>();
            services.AddHostedService<DatabaseSeedHostedService>();
        }

        return services;
    }

    public static IServiceCollection AddPbmsPayments(this IServiceCollection services, IConfiguration config, IWebHostEnvironment env, bool isTesting)
    {
        services.Configure<PayOsOptions>(config.GetSection(PayOsOptions.SectionName));
        var payOsConfig = config.GetSection(PayOsOptions.SectionName).Get<PayOsOptions>() ?? new PayOsOptions();

        if (!isTesting && !env.IsDevelopment() && !payOsConfig.DemoMode)
        {
            if (IsPlaceholderSecret(payOsConfig.ClientId) || IsPlaceholderSecret(payOsConfig.ApiKey) || IsPlaceholderSecret(payOsConfig.ChecksumKey))
                throw new InvalidOperationException("PayOs secrets must be configured with non-placeholder values when PayOs:DemoMode=false.");
        }

        if (isTesting || payOsConfig.DemoMode || string.IsNullOrWhiteSpace(payOsConfig.ClientId))
            services.AddSingleton<IPayOsPaymentService, StubPayOsPaymentService>();
        else
            services.AddHttpClient<IPayOsPaymentService, PayOsPaymentService>();

        return services;
    }

    public static IServiceCollection AddPbmsOcr(this IServiceCollection services, IConfiguration config, bool isTesting)
    {
        services.Configure<PlateOcrOptions>(config.GetSection(PlateOcrOptions.SectionName));

        var ocrOptions = config.GetSection(PlateOcrOptions.SectionName).Get<PlateOcrOptions>() ?? new PlateOcrOptions();
        var useStubOcr = isTesting || ocrOptions.UseStub || !OperatingSystem.IsWindows();

        if (useStubOcr)
            services.AddSingleton<IPlateOcrService, StubPlateOcrService>();
        else
        {
            services.AddSingleton<IPlateOcrService, PaddlePlateOcrService>();
            services.AddHostedService<PlateOcrWarmupHostedService>();
        }

        return services;
    }

    public static IServiceCollection AddPbmsAuth(this IServiceCollection services, IConfiguration config, IWebHostEnvironment env, bool isTesting)
    {
        var jwtSecret = config["Jwt:Secret"] ?? "your_jwt_secret_here_min_32_characters_long";
        var jwtIssuer = config["Jwt:Issuer"] ?? "PBMS";
        var jwtAudience = config["Jwt:Audience"] ?? "PBMS";

        if (!isTesting && !env.IsDevelopment() && IsPlaceholderSecret(jwtSecret))
            throw new InvalidOperationException("Jwt:Secret must be configured with a non-placeholder value in non-development environments.");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtIssuer,
                    ValidAudience = jwtAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                };
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                            context.Token = accessToken;
                        return Task.CompletedTask;
                    },
                };
            });

        services.AddAuthorization(options =>
        {
            if (!isTesting)
            {
                options.FallbackPolicy = new AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .Build();
            }
        });

        return services;
    }

    public static IServiceCollection AddPbmsCors(this IServiceCollection services, IConfiguration config, IWebHostEnvironment env, bool isTesting)
    {
        var allowedOrigins = config.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? ["http://localhost:5173"];
        var normalizedOrigins = allowedOrigins
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (!isTesting && !env.IsDevelopment())
        {
            if (normalizedOrigins.Length == 0)
                throw new InvalidOperationException("Cors:AllowedOrigins must contain at least one explicit origin in non-development environments.");

            if (normalizedOrigins.Any(x => x == "*" || x.Contains('*')))
                throw new InvalidOperationException("Cors:AllowedOrigins cannot contain wildcard origins in non-development environments.");
        }

        services.AddCors(options =>
        {
            options.AddPolicy("Frontend", policy =>
            {
                policy.WithOrigins(normalizedOrigins)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        return services;
    }

    public static IServiceCollection AddPbmsRuntimeProtections(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            options.AddFixedWindowLimiter("auth", limiter =>
            {
                limiter.PermitLimit = 8;
                limiter.Window = TimeSpan.FromMinutes(1);
                limiter.QueueLimit = 0;
            });

            options.AddFixedWindowLimiter("wallet", limiter =>
            {
                limiter.PermitLimit = 20;
                limiter.Window = TimeSpan.FromMinutes(1);
                limiter.QueueLimit = 0;
            });

            options.AddFixedWindowLimiter("ocr", limiter =>
            {
                limiter.PermitLimit = 15;
                limiter.Window = TimeSpan.FromMinutes(1);
                limiter.QueueLimit = 0;
            });

            options.AddFixedWindowLimiter("webhook", limiter =>
            {
                limiter.PermitLimit = 60;
                limiter.Window = TimeSpan.FromMinutes(1);
                limiter.QueueLimit = 0;
            });
        });

        return services;
    }

    private static bool IsPlaceholderSecret(string secret) =>
        string.IsNullOrWhiteSpace(secret)
        || secret.Contains("your_jwt_secret_here", StringComparison.OrdinalIgnoreCase)
        || secret.Contains("your_payos_", StringComparison.OrdinalIgnoreCase);
}
