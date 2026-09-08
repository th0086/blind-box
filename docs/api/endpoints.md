---
owner: backend
status: draft
updated_at: 2026-06-02
---

# API Endpoints

Base URL behind Nginx: `/api`

## Auth

### `POST /api/auth/login`

- Purpose: Login with phone/password and set auth cookie.
- Auth: Public.
- Request:

```json
{"phone":"+254700000001","password":"******"}
```

- Response:

```json
{"success":true}
```

- Errors: `400`, `401`.

### `GET /api/auth/sso`

- Purpose: Login via merchant SSO callback.
- Auth: Public.
- Query: `phone`, `merchant`, `token`.
- Response: `{"success":true}`.
- Errors: `400`, `401`.

### `GET /api/auth/me`

- Purpose: Get current user profile.
- Auth: Required (`bb_token` cookie).
- Response includes user id, phone, role.
- Errors: `401`.

### `POST /api/auth/logout`

- Purpose: Clear auth cookie.
- Auth: Public/optional.
- Response: `{"success":true}`.

## Draw

### `GET /api/draw/quota`

- Purpose: Return remaining draws for current user.
- Auth: Required.

### `POST /api/draw`

- Purpose: Execute one blind-box draw.
- Auth: Required.

### `POST /api/draw/reset`

- Purpose: Reset daily quota.
- Auth: Super admin only.

### `GET /api/history`

- Purpose: Get current user draw history.
- Auth: Required.

### `GET /api/broadcast/recent`

- Purpose: Get recent winners for marquee/realtime feed.
- Auth: Public.

## Prizes

### `GET /api/prizes`

- Purpose: List prizes.
- Auth: Public.
- Query: `includeInactive=true|false`.

### `POST /api/prizes`

- Purpose: Create a prize.
- Auth: Super admin.

### `PUT /api/prizes/:id`

- Purpose: Update a prize.
- Auth: Super admin.

### `DELETE /api/prizes/:id`

- Purpose: Delete a prize.
- Auth: Super admin.

## Ops

### `GET /api/health`

- Purpose: Liveness/health check for VM deployment.
- Auth: Public.
- Response:

```json
{"ok":true,"service":"blind-box-backend"}
```

## Chinese Notes

- 若前端與後端同網域走 Nginx，前端建議使用 `/api` 相對路徑，避免跨域問題。
