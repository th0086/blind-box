---
owner: platform
status: draft
updated_at: 2026-06-02
---

# Local Development

## Environment Files

Local development uses app-specific env files:

- `backend/.env` for NestJS backend settings
- `frontend/.env.local` for Next.js frontend settings

Recommended setup:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Root `.env` is reserved for VM deployment via `deploy/docker-compose.vm.yml`.

## Local MongoDB

Use local MongoDB with credentials from backend env:

- `mongodb://admin:admin123@localhost:27017/blindbox?authSource=admin`

## Variable Matrix

Backend (`backend/.env`):
- `NODE_ENV`
- `APP_PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRY`
- `SUPER_ADMIN_PHONE`
- `SUPER_ADMIN_PASSWORD`
- `DAILY_DRAW_LIMIT`
- `MERCHANT_ID`
- `MERCHANT_REDIRECT_URL`

Frontend (`frontend/.env.local`):
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SOCKET_URL`

VM deployment (`.env`):
- `MONGODB_INITDB_ROOT_USERNAME`
- `MONGODB_INITDB_ROOT_PASSWORD`
- Backend runtime vars consumed by container (`NODE_ENV`, `APP_PORT`, `JWT_SECRET`, ...)

## Run Commands

From repository root:

```bash
npm run dev:backend
npm run dev:frontend
```

Backend default: `http://localhost:5022`
Frontend default: `http://localhost:5012`

## Common Local Issues

1. Next.js stale chunk cache:

```bash
cd frontend
rm -rf .next-dev .next
```

2. Mongo host mismatch (`mongo` vs `localhost`):
- Local non-docker backend should use `localhost` in `MONGODB_URI`.

3. Port conflict:

```bash
lsof -nP -iTCP:5012 -sTCP:LISTEN
lsof -nP -iTCP:5022 -sTCP:LISTEN
```

## Chinese Notes

- 本機啟動時不要使用 root `.env` 取代 `frontend/.env.local`。
- 若要測試 VM 行為，請使用 `deploy/docker-compose.vm.yml` 而不是本機 dev 命令。
