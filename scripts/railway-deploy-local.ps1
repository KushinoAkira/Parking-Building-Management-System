# PBMS — deploy API lên Railway từ máy local
#   railway login
#   railway link
#   .\scripts\railway-deploy-local.ps1

$ErrorActionPreference = "Stop"

if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "Cai Railway CLI: npm i -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

railway whoami 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Chua dang nhap. Chay: railway login" -ForegroundColor Yellow
    exit 1
}

Write-Host "=== Bien bat buoc tren Railway (Variables) ===" -ForegroundColor Cyan
Write-Host @"
RAILWAY_DOCKERFILE_PATH = Dockerfile
DATABASE_URL           = `${{Postgres.DATABASE_URL}}
JWT signing secret     = (>= 32 chars, Railway variable Jwt__Secret)
ASPNETCORE_ENVIRONMENT = Production
PayOs__DemoMode        = true
Cors__AllowedOrigins__0 = https://parking-management-syste-97d18.web.app
"@

Write-Host "Xem them: docs/railway-quickstart.md`n" -ForegroundColor Gray

$confirm = Read-Host "Da set variables + Generate Domain tren Railway? (y/N)"
if ($confirm -notin @("y", "Y")) { exit 0 }

Set-Location (Split-Path $PSScriptRoot -Parent)
Write-Host "Deploy tu root repo..." -ForegroundColor Green
railway up --detach
Write-Host "Xong. Kiem tra Deployments tren railway.app" -ForegroundColor Green
