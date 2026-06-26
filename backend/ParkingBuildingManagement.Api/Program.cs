using ParkingBuildingManagement.Api.Extensions;
using ParkingBuildingManagement.Api.Middleware;
using ParkingBuildingManagement.Api.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

var isTesting = builder.Environment.IsEnvironment("Testing");

builder.Services
    .AddPbmsData(builder.Configuration, isTesting)
    .AddPbmsCoreServices(isTesting)
    .AddPbmsPayments(builder.Configuration, builder.Environment, isTesting)
    .AddPbmsOcr(builder.Configuration, isTesting)
    .AddPbmsAuth(builder.Configuration, builder.Environment, isTesting)
    .AddPbmsCors(builder.Configuration, builder.Environment, isTesting)
    .AddPbmsRuntimeProtections();

builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseRateLimiter();
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    context.Response.Headers["X-Permitted-Cross-Domain-Policies"] = "none";
    await next();
});
app.UseCors("Frontend");
if (!app.Environment.IsDevelopment())
    app.UseHsts();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<ParkingBuildingManagement.Api.Hubs.ParkingHub>("/hubs/parking");

app.Run();

public partial class Program { }
