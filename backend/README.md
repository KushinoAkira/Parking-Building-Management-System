# Backend — Parking Building Management API

ASP.NET Core Web API + Entity Framework Core + **PostgreSQL**.

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
| `appsettings.Development.json` | Postgres local khi dev |
| User Secrets / biến môi trường | Mật khẩu DB thật (không commit) |
| `DATABASE_URL` | Railway/Heroku (tự parse sang Npgsql) |

Ví dụ PostgreSQL local:

```
Host=localhost;Port=5432;Database=ParkingBuildingManagement;Username=postgres;Password=your_password_here
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
dotnet ef migrations add PbmsPostgresInitial
dotnet ef database update
```

## Smoke checklist (deploy)

- `GET /api/health` trả về `status=ok` và `database=connected`.
- Đăng nhập driver/staff thành công bằng tài khoản seed.
- Driver web/mobile tải được dashboard (không lỗi CORS/network).
- Tạo reservation, check-in/check-out và cập nhật slot status đúng.
- Wallet top-up callback (PayOS demo/real) cập nhật số dư và transactions.
