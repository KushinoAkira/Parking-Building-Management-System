# Parking Building Management System (SWP391)

Monorepo quản lý bãi đỗ xe: **React** (frontend), **ASP.NET Core** (backend), **SQL Server** (database).

## Cấu trúc thư mục

```
├── frontend/          # React + Vite + Tailwind (UI từ Figma)
├── backend/           # .NET Web API + Entity Framework Core
│   └── ParkingBuildingManagement.Api/
├── database/          # pbms-schema.dbml (ERD tham chiếu)
└── README.md
```

## Yêu cầu

- Node.js 18+ và pnpm (hoặc npm)
- .NET SDK 8+ (đang dùng .NET 10)
- SQL Server hoặc SQL Server LocalDB

## Frontend (React)

```bash
cd frontend
pnpm install   # hoặc npm install
cp .env.example .env
pnpm dev       # http://localhost:5173
```

## Backend (.NET + SQL Server)

1. Sao chép cấu hình mẫu (nếu cần chỉnh connection string):

   ```bash
   cd backend/ParkingBuildingManagement.Api
   # Chỉnh appsettings.Development.json hoặc dùng User Secrets cho mật khẩu thật
   ```

2. Tạo database (migration):

   ```bash
   dotnet ef migrations add PbmsInitialSchema --project ParkingBuildingManagement.Api
   dotnet ef database update --project ParkingBuildingManagement.Api
   ```

3. Chạy API:

   ```bash
   dotnet run --project ParkingBuildingManagement.Api
   ```

   API: `http://localhost:5122`  
   Health: `GET /api/health`  
   Slots: `GET /api/parkingslots`

## Kết nối FE ↔ BE

- Vite proxy: request `/api/*` từ frontend được chuyển tới `http://localhost:5122`
- Hoặc dùng biến `VITE_API_BASE_URL` trong `frontend/.env`

## Ghi chú bảo mật

- Không commit `.env`, mật khẩu SQL thật, hay `appsettings.Local.json`
- Dùng `appsettings.example.json` và placeholder trong repo
