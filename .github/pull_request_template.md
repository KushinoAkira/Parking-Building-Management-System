## Summary
- what changed and why

## Security Checklist
- [ ] No real secrets in diff (`.env`, `appsettings.Local.json`, API keys, JWT secrets, DB passwords)
- [ ] `appsettings.example.json` / `.env.example` use placeholders only
- [ ] CORS origins are explicit (no wildcard with credentials)
- [ ] Auth-protected endpoints keep authorization checks
- [ ] Webhook/payment changes include signature and idempotency checks

## Test Plan
- [ ] Backend tests pass (`dotnet test`)
- [ ] Frontend tests pass (`npm run test`)
- [ ] Frontend build passes (`npm run build`)
- [ ] Smoke test done for auth, session, reservation, wallet, and health endpoint
