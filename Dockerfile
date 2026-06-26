# Monorepo root Dockerfile — Railway builds from repo root by default.
# Prefer service Root Directory = backend/ParkingBuildingManagement.Api when possible.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY backend/ParkingBuildingManagement.Api/ParkingBuildingManagement.Api.csproj backend/ParkingBuildingManagement.Api/
RUN dotnet restore backend/ParkingBuildingManagement.Api/ParkingBuildingManagement.Api.csproj
COPY backend/ParkingBuildingManagement.Api/ backend/ParkingBuildingManagement.Api/
RUN dotnet publish backend/ParkingBuildingManagement.Api/ParkingBuildingManagement.Api.csproj \
    -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://0.0.0.0:${PORT:-8080}
EXPOSE 8080
ENTRYPOINT ["dotnet", "ParkingBuildingManagement.Api.dll"]
