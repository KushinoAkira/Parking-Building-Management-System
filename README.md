# Parking Building Management System (SWP391)

Monorepo quản lý bãi đỗ xe: **React** (frontend), **ASP.NET Core** (backend), **PostgreSQL** (database).

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
- PostgreSQL 14+ (local hoặc Docker; Railway dùng `DATABASE_URL`)

## Frontend (React)

```bash
cd frontend
pnpm install   # hoặc npm install
cp .env.example .env
pnpm dev       # http://localhost:5173
```

## Backend (.NET + PostgreSQL)

1. Sao chép cấu hình mẫu (nếu cần chỉnh connection string):

   ```bash
   cd backend/ParkingBuildingManagement.Api
   # Chỉnh appsettings.Development.json hoặc dùng User Secrets cho mật khẩu thật
   ```

2. Tạo database (migration):

   ```bash
   dotnet ef migrations add PbmsPostgresInitial --project ParkingBuildingManagement.Api
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

## GitHub Actions (CI & Security)

Repo dùng 2 workflow trong `.github/workflows/`. Cả hai **tự chạy** khi:

- **Push** lên nhánh `main` hoặc `dev`
- Mở / cập nhật **Pull Request** vào `main` hoặc `dev`

Xem kết quả: GitHub repo → tab **Actions** → chọn workflow run.

### 1. CI (`ci.yml`)

Kiểm tra code build được trước khi merge.

| Job | Thư mục | Việc làm |
|-----|---------|----------|
| `frontend-build` | `frontend/` | `npm ci` → lint (nếu có script) → `npm run build` |
| `backend-build` | `backend/` | `dotnet restore` + `dotnet build` (Release) trên `ParkingBuildingManagement.slnx` |

**Cách dùng hàng ngày**

1. Làm việc trên nhánh feature (ví dụ `feature/auth-api`).
2. Push lên GitHub và mở PR vào `main` hoặc `dev`.
3. Đợi CI xanh (✓) trên PR — cả 2 job phải pass.
4. Nếu đỏ (✗), bấm vào job lỗi → xem log step fail → sửa code → push thêm commit (CI chạy lại).

**Chạy giống CI trên máy local**

```bash
# Frontend
cd frontend
npm ci
npm run lint --if-present
npm run build

# Backend
cd backend
dotnet restore ParkingBuildingManagement.slnx
dotnet build ParkingBuildingManagement.slnx --configuration Release --no-restore
```

> **Lưu ý:** CI backend chỉ **build**, không chạy `dotnet test` (chưa có test project). Khi đã có project test, thêm bước test vào `.github/workflows/ci.yml`.

### 2. Security Scan (`security-scan.yml`)

Quét secret lộ trong code / lịch sử Git (Gitleaks): `.env`, API key, JWT, mật khẩu DB, token, private key, v.v.

| Job | Mô tả |
|-----|--------|
| `secret-scan` | Checkout full history (`fetch-depth: 0`) → chạy `gitleaks/gitleaks-action@v2` |

**Nếu workflow fail**

- Không commit file `.env`, `secrets.json`, key thật.
- Dùng placeholder trong `appsettings.example.json` / `.env.example`.
- Nếu secret đã từng commit: xóa khỏi repo, **đổi/rotate** secret đó, cân nhắc dọn Git history.

### Checklist trước khi merge PR

- [ ] CI: `frontend-build` ✓
- [ ] CI: `backend-build` ✓
- [ ] Security Scan: `secret-scan` ✓
- [ ] Không có file nhạy cảm trong diff (`.env`, mật khẩu thật, key)

### Thêm nhánh `dev` (nếu chưa có)

```bash
git checkout -b dev
git push -u origin dev
```

Workflow đã cấu hình sẵn cho `main` và `dev`; push/PR vào hai nhánh này đều kích hoạt Actions.

## Ghi chú bảo mật

- Không commit `.env`, mật khẩu SQL thật, hay `appsettings.Local.json`
- Dùng `appsettings.example.json` và placeholder trong repo
- Trước khi commit: kiểm tra `git diff --cached` để chắc chắn không có key thật (`Jwt`, `PayOs`, DB password)
- Secrets production chỉ đặt ở Railway Variables / local machine, không đặt trong file tracked
