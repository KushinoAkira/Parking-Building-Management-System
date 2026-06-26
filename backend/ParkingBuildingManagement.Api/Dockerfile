FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ParkingBuildingManagement.Api.csproj .
RUN dotnet restore ParkingBuildingManagement.Api.csproj
COPY . .
RUN dotnet publish ParkingBuildingManagement.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://0.0.0.0:${PORT:-8080}
EXPOSE 8080
ENTRYPOINT ["dotnet", "ParkingBuildingManagement.Api.dll"]
