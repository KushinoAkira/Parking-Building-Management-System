# PBMS Secret Rotation Runbook

Use this when a credential may have been exposed (commit, log, chat, or compromised host).

## 1. JWT (`Jwt__Secret`)

1. Generate a new secret (≥ 32 characters).
2. Update Railway variable `Jwt__Secret`.
3. Redeploy API.
4. All users must sign in again (existing tokens become invalid).

## 2. PostgreSQL (`DATABASE_URL` / connection string)

1. Rotate password in PostgreSQL provider.
2. Update Railway `DATABASE_URL` (or `ConnectionStrings__DefaultConnection`).
3. Redeploy API and verify `/health`.

## 3. PayOS (`PayOs__ChecksumKey`, `PayOs__ClientId`, `PayOs__ApiKey`)

1. Rotate keys in PayOS dashboard.
2. Update Railway `PayOs__*` variables.
3. Redeploy API.
4. Run a small test top-up in staging before production traffic.

## 4. Local development

- Store real values only in `appsettings.Local.json` (gitignored) or User Secrets.
- Never commit `.env`, `appsettings.Local.json`, or production Railway exports.

## 5. Post-incident

- Review `git log` and CI secret-scan output.
- Invalidate leaked tokens/passwords immediately.
- Document incident time, rotated secrets, and deploy revision.
