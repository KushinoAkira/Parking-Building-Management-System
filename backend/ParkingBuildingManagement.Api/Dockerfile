FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ParkingBuildingManagement.Api.csproj .
RUN dotnet restore ParkingBuildingManagement.Api.csproj
COPY . .
RUN dotnet publish ParkingBuildingManagement.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["/bin/sh", "-c", "exec dotnet ParkingBuildingManagement.Api.dll --urls \"http://0.0.0.0:${PORT:-8080}\""]
