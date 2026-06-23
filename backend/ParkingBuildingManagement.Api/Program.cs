using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Middleware;
using ParkingBuildingManagement.Api.Services;
using ParkingBuildingManagement.Api.Services.Ocr;
using ParkingBuildingManagement.Api.Services.PayOs;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

var isTesting = builder.Environment.IsEnvironment("Testing");

if (isTesting)
{
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseInMemoryDatabase("PbmsIntegrationTests"));
}
else
{
    var connectionString = DatabaseConnection.Resolve(builder.Configuration);

    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseNpgsql(connectionString));
}

builder.Services.AddScoped<IParkingRealtimeNotifier, ParkingRealtimeNotifier>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ISlotAllocationService, SlotAllocationService>();
builder.Services.AddScoped<IPricingService, PricingService>();
builder.Services.AddScoped<IParkingSessionService, ParkingSessionService>();
builder.Services.AddScoped<IReservationService, ReservationService>();
builder.Services.AddScoped<IDatabaseSeeder, DatabaseSeeder>();
builder.Services.AddScoped<IWalletService, WalletService>();

builder.Services.Configure<PayOsOptions>(builder.Configuration.GetSection(PayOsOptions.SectionName));
var payOsConfig = builder.Configuration.GetSection(PayOsOptions.SectionName).Get<PayOsOptions>() ?? new PayOsOptions();
if (isTesting || payOsConfig.DemoMode || string.IsNullOrWhiteSpace(payOsConfig.ClientId))
    builder.Services.AddSingleton<IPayOsPaymentService, StubPayOsPaymentService>();
else
    builder.Services.AddHttpClient<IPayOsPaymentService, PayOsPaymentService>();

builder.Services.Configure<PlateOcrOptions>(builder.Configuration.GetSection(PlateOcrOptions.SectionName));

if (isTesting)
    builder.Services.AddSingleton<IPlateOcrService, StubPlateOcrService>();
else
{
    builder.Services.AddSingleton<IPlateOcrService, PaddlePlateOcrService>();
    builder.Services.AddHostedService<PlateOcrWarmupHostedService>();
}

var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? "your_jwt_secret_here_min_32_characters_long";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "PBMS";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "PBMS";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
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

builder.Services.AddAuthorization(options =>
{
    if (!isTesting)
    {
        options.FallbackPolicy = new AuthorizationPolicyBuilder()
            .RequireAuthenticatedUser()
            .Build();
    }
});
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddOpenApi();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

if (!isTesting)
{
    using (var scope = app.Services.CreateScope())
    {
        var seeder = scope.ServiceProvider.GetRequiredService<IDatabaseSeeder>();
        await seeder.SeedAsync();
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("Frontend");
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<ParkingBuildingManagement.Api.Hubs.ParkingHub>("/hubs/parking");

app.Run();

public partial class Program { }
