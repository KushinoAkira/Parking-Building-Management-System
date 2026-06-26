# Railway — bật API production

Domain: `https://parking-building-management-system-production.up.railway.app`

## Bước 0 — BẮT BUỘC (ép Railway dùng Dockerfile)

Railway mặc định dùng **Railpack** → monorepo sẽ fail `could not determine how to build`.

Trên **service API** → tab **Variables**, thêm:

```env
RAILWAY_DOCKERFILE_PATH=Dockerfile
NO_CACHE=1
```

(`NO_CACHE=1` chỉ cần lần deploy đầu; xóa sau khi build xanh.)

**Settings → Build** (hoặc **Deploy** → biểu tượng bánh răng):
- **Config file path** = `/railway.json`  
  (nếu có ô này — một số UI Railway đặt trong Source / Build)

Sau đó **Redeploy**. Build log phải thấy **Dockerfile**, không phải `railpack-v0.x`.

---

## Bước 1 — Source

1. https://railway.app → project **perceptive-purpose**
2. Click **service API** (Web Service)
3. **Settings → Source** — repo `Parking-Building-Management-System`, branch `main`

## Bước 2 — Variables runtime

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
ASPNETCORE_ENVIRONMENT=Production
PayOs__DemoMode=true
Cors__AllowedOrigins__0=https://parking-management-syste-97d18.web.app
```

Thêm biến riêng tên `Jwt__Secret` (chuỗi ngẫu nhiên ≥ 32 ký tự).

## Bước 3 — Networking

**Settings → Networking → Generate Domain** → gán domain public.

## Bước 4 — Redeploy + kiểm tra

```bash
curl https://parking-building-management-system-production.up.railway.app/api/health
```

Kỳ vọng: `"status":"ok"`.

---

## Lưu ý

| Hiện tượng | Giải thích |
|------------|------------|
| GitHub Actions Deploy **xanh** | Chỉ chạy `verify` — **không** push lên Railway nếu chưa có `RAILWAY_TOKEN` |
| `404 Application not found` | Service chưa chạy / domain chưa gán / build fail |
| Build log vẫn **Railpack** | Thiếu `RAILWAY_DOCKERFILE_PATH` hoặc config path `/railway.json` |

## Deploy từ máy local

```powershell
railway login
railway link
.\scripts\railway-deploy-local.ps1
```
