---
owner: platform
status: draft
updated_at: 2026-06-02
---

# VM Deployment (Docker + MongoDB)

## Architecture

- `nginx` exposes public port `80`
- `frontend` serves Next.js app on internal port `5012`
- `backend` serves NestJS API on internal port `5022`
- `mongo` stores data in Docker volume `mongo_data`

Public traffic path:
- `/` -> frontend
- `/api/*` -> backend
- `/socket.io/*` -> backend

## 1. VM Prerequisites

Install Docker Engine and Docker Compose plugin.

Ubuntu/Debian example:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## 2. Prepare Repository and Environment

```bash
git clone <your-repo-url>
cd blind-box
cp .env.example .env
```

Edit `.env` and set secure values at least for:
- `MONGODB_INITDB_ROOT_PASSWORD`
- `JWT_SECRET`
- `SUPER_ADMIN_PASSWORD`
- `MERCHANT_REDIRECT_URL` (use your production domain)

## 3. Start Services

```bash
cd deploy
docker compose -f docker-compose.vm.yml up -d --build
```

## 4. Verify

```bash
docker compose -f docker-compose.vm.yml ps
curl http://127.0.0.1/api/health
```

Expected health response:

```json
{"ok":true,"service":"blind-box-backend"}
```

## 5. Common Operations

Rebuild and restart after pulling latest code:

```bash
git pull
cd deploy
docker compose -f docker-compose.vm.yml up -d --build
```

View logs:

```bash
docker compose -f docker-compose.vm.yml logs -f nginx
docker compose -f docker-compose.vm.yml logs -f frontend
docker compose -f docker-compose.vm.yml logs -f backend
docker compose -f docker-compose.vm.yml logs -f mongo
```

Stop services:

```bash
docker compose -f docker-compose.vm.yml down
```

## 6. Hardening Checklist

- Put TLS in front of this stack (Nginx with certbot, Caddy, or cloud LB).
- Restrict VM firewall to ports `22`, `80`, `443`.
- Keep MongoDB bound to localhost only (already set in compose).
- Rotate JWT and super admin credentials periodically.
- Add backup jobs for `mongo_data` volume.

## Chinese Notes

- 第一次上版建議先在 staging VM 照本文件完整演練一次。
- 任何密碼不得沿用 `.env.example` 預設值。
