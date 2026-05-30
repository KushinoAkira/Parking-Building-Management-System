# Backend — Parking Building Management API

ASP.NET Core Web API + Entity Framework Core + **SQL Server**.

## Chạy nhanh

```bash
cd ParkingBuildingManagement.Api
dotnet restore
dotnet ef database update
dotnet run
```

## Connection string

| File | Mục đích |
|------|----------|
| `appsettings.example.json` | Mẫu placeholder (commit được) |
| `appsettings.Development.json` | LocalDB mặc định khi dev |
| User Secrets / biến môi trường | Mật khẩu SQL thật (không commit) |

Ví dụ SQL Server:

```
Server=localhost;Database=ParkingBuildingManagement;User Id=your_user;Password=your_password;TrustServerCertificate=True;
```

## API endpoints (khởi tạo)

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/api/health` | Trạng thái API + kết nối DB |
| GET | `/api/parkingslots` | Danh sách chỗ đỗ |

## Database schema (PBMS)

14 bảng theo `database/pbms-schema.dbml`:

| Nhóm | Bảng |
|------|------|
| Auth | `Roles`, `Users` |
| Facility | `ParkingFacility`, `VehicleTypes`, `ParkingZones`, `ParkingSlots` |
| Pricing | `PricingPolicies` |
| Booking | `Reservations` |
| Operations | `ParkingSessions`, `Payments` |
| Exceptions | `Incidents` |
| Feedback | `Feedbacks`, `ReportSnapshots` |
| System | `SystemConfigs` |

Seed mặc định: Roles (Admin, Manager, Staff, Driver), VehicleTypes (MOTORBIKE, CAR, EV).

```bash
dotnet ef migrations add PbmsInitialSchema
dotnet ef database update
```
