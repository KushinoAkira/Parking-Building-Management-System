# Railway — bật API production (5 phút)

Domain mục tiêu: `https://parking-building-management-system-production.up.railway.app`

> Repo đã có `Dockerfile` + `railway.json` ở **root** — Railway connect GitHub sẽ build từ root, **không cần** Root Directory.

## Bước 1 — Railway dashboard

1. Mở https://railway.app → project **perceptive-purpose**
2. Click **service API** (Web Service, không phải Postgres)
3. **Settings → Source** — đảm bảo đã connect repo GitHub `Parking-Building-Management-System`, branch `main`

## Bước 2 — Variables (tab Variables của service API)

Thêm từng dòng (Raw Editor):

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
ASPNETCORE_ENVIRONMENT=Production
PayOs__DemoMode=true
Cors__AllowedOrigins__0=https://parking-management-syste-97d18.web.app
```

Thêm riêng biến **Jwt** + `__Secret` trên Railway (chuỗi ngẫu nhiên ≥ 32 ký tự).

## Bước 3 — Public domain

1. Service API → **Settings → Networking**
2. **Generate Domain** (hoặc gán lại domain cũ nếu có)
3. Copy domain — ví dụ `parking-building-management-system-production.up.railway.app`

## Bước 4 — Redeploy

1. Tab **Deployments** → **Deploy** / **Redeploy**
2. Đợi Build (Docker) xong → Deploy logs không crash

## Bước 5 — Kiểm tra

```bash
curl https://parking-building-management-system-production.up.railway.app/api/health
```

Kỳ vọng: `"status":"ok"` và `"database":"connected"`.

## Bước 6 — Frontend Firebase

```bash
cd frontend
# Tạo .env.production.local (không commit) hoặc build CI với biến:
# VITE_API_BASE_URL=https://parking-building-management-system-production.up.railway.app
npm run build
npx firebase deploy --only hosting --project parking-management-syste-97d18
```

## Deploy từ máy local (tùy chọn)

```powershell
npm i -g @railway/cli
railway login
railway link    # chọn perceptive-purpose + service API
.\scripts\railway-deploy-local.ps1
```

## Lỗi thường gặp

| Triệu chứng | Cách xử lý |
|-------------|------------|
| `404 Application not found` | Domain chưa gán service / service chưa chạy → Generate Domain + Redeploy |
| Railpack could not build | Đã fix bằng root `Dockerfile` — redeploy từ `main` |
| Crash startup JWT | Đặt signing secret thật (≥ 32 ký tự) trên Railway Variables |
| Crash: database | `DATABASE_URL=${{Postgres.DATABASE_URL}}` + Postgres cùng project |
| GitHub Deployments đỏ | Thiếu GitHub secrets — **bỏ qua** nếu deploy qua Railway dashboard |
