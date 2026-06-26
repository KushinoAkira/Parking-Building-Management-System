# Deploy CI/CD — Railway (API) + Firebase (Frontend)

Workflow: `.github/workflows/deploy.yml`

Chạy khi **push lên `main`** hoặc **Run workflow** thủ công (`workflow_dispatch`).

> Dấu đỏ tab **GitHub Deployments** = workflow thiếu secrets — không chặn deploy trên [railway.app](https://railway.app). Hướng dẫn bật API: [docs/railway-quickstart.md](railway-quickstart.md).

## Luồng deploy

1. `verify-before-deploy` — typecheck/test/build frontend + build/test backend
2. `deploy-railway-api` — `railway up` từ `backend/ParkingBuildingManagement.Api`
3. `deploy-firebase-hosting` — build Vite + `firebase deploy --only hosting`
4. `post-deploy-smoke` — gọi `/api/health` và URL Firebase hosting

Migration DB chạy tự động khi API khởi động (`DatabaseSeeder.MigrateAsync`).

## GitHub Secrets (Settings → Secrets and variables → Actions)

| Secret | Mô tả |
|--------|--------|
| `RAILWAY_TOKEN` | **Project token** tạo trong Railway → Project → Settings → Tokens |
| `FIREBASE_SERVICE_ACCOUNT` | JSON service account Firebase (quyền Firebase Hosting Admin) |

## GitHub Variables (Settings → Secrets and variables → Actions → Variables)

| Variable | Ví dụ | Mô tả |
|----------|-------|--------|
| `VITE_API_BASE_URL` | `https://parking-building-management-system-production.up.railway.app` | URL public API (dùng lúc build frontend) |
| `FIREBASE_HOSTING_URL` | `https://parking-management-syste-97d18.web.app` | URL hosting để smoke test |
| `RAILWAY_SERVICE_NAME` | tên service trên Railway dashboard | Tên hiển thị của service API (không phải UUID) |
| `RAILWAY_ENVIRONMENT` | `production` | Environment Railway cần deploy |

> `FIREBASE_HOSTING_URL` dùng cho bước smoke test sau deploy.

## Railway — chuẩn bị một lần

1. Tạo project PostgreSQL + Web Service (.NET).
2. Root directory service: `backend/ParkingBuildingManagement.Api`.
3. Đặt biến môi trường trên Railway (không commit):
   - `DATABASE_URL`
   - `Jwt__Secret`
   - `Cors__AllowedOrigins__0` = URL Firebase (`https://parking-management-syste-97d18.web.app`)
   - `PayOs__*` (nếu bật PayOS thật)
4. Tạo **Project Token** → lưu vào GitHub secret `RAILWAY_TOKEN`.
5. Ghi **service name** (card trên dashboard) → GitHub variable `RAILWAY_SERVICE_NAME`.

Nếu Railway đã connect GitHub repo: redeploy sau mỗi merge vào `main`.

**Settings service API (bắt buộc nếu không dùng Dockerfile ở root repo):**

1. Vào **Project** trên Railway (canvas có các ô service).
2. **Click vào ô service API** (không phải Project Settings ở góc trên).
3. Tab **Settings** của service đó.
4. Mục **Source** (hoặc **Service Source**) → **Root Directory** = `backend/ParkingBuildingManagement.Api`
5. Bấm **Deploy** / Save rồi redeploy.

> Nếu không thấy **Source** / **Root Directory**: service có thể chưa connect GitHub repo. Cách không cần setting: dùng `Dockerfile` + `railway.toml` ở **root repo**.

- Builder: **Dockerfile**

**Variables bắt buộc:**

| Biến | Giá trị |
|------|---------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `Jwt__Secret` | Chuỗi ≥ 32 ký tự (không placeholder) |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `Cors__AllowedOrigins__0` | `https://parking-management-syste-97d18.web.app` |
| `PayOs__DemoMode` | `true` nếu chưa có key PayOS thật |

**Logs:** Deployments → deploy fail → Build logs (Docker/.NET) hoặc Deploy logs (JWT, DB, PayOS).

## Firebase — chuẩn bị một lần

1. Project: `parking-management-syste-97d18` (đã có trong `frontend/.firebaserc`).
2. Firebase Console → Project settings → Service accounts → **Generate new private key**.
3. Dán toàn bộ JSON vào GitHub secret `FIREBASE_SERVICE_ACCOUNT`.
4. Đặt `FIREBASE_HOSTING_URL` = URL hosting production.

## Chạy deploy thủ công

GitHub → **Actions** → **Deploy** → **Run workflow** → branch `main`.

## Troubleshooting

| Lỗi | Hướng xử lý |
|-----|-------------|
| Railway `Project Token not found` | Token phải là **project token**, không dùng account token sai chỗ |
| Railway `Not signed in` | Kiểm tra `RAILWAY_SERVICE_NAME` đúng tên friendly trên dashboard |
| Firebase auth fail | JSON service account đầy đủ; bật Firebase Hosting API |
| Frontend gọi sai API | Kiểm tra `VITE_API_BASE_URL` variable trước khi build |
| Railway Railpack "could not determine how to build" | Service đang build từ **root monorepo** thay vì thư mục API. Đặt **Root Directory** = `backend/ParkingBuildingManagement.Api` **hoặc** dùng `Dockerfile` + `railway.toml` ở root repo (sau merge fix monorepo). |
