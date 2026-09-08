---
owner: operations
status: draft
updated_at: 2026-06-02
---

# Admin Playbook

## Access Requirements

- Must login as `super_admin` role.
- Admin APIs are enforced by `JwtAuthGuard + SuperAdminGuard`.

## Daily Operations

1. Verify service status:
   - Check `/api/health`
   - Check frontend landing page renders correctly
2. Prize management:
   - Review active prize list
   - Create/update/deactivate prizes as needed
3. Draw monitoring:
   - Spot-check recent winner feed
   - Check abnormal draw volume

## Incident Quick Actions

- Backend unhealthy:
  - `cd deploy && docker compose -f docker-compose.vm.yml logs -f backend`
  - restart backend container if needed
- Frontend unavailable:
  - inspect nginx and frontend logs
- Mongo connection errors:
  - confirm mongo container health and credentials in `.env`

## Permission Matrix

- Public:
  - `GET /api/prizes`
  - `GET /api/broadcast/recent`
- Authenticated user:
  - `GET /api/auth/me`
  - `GET /api/draw/quota`
  - `POST /api/draw`
  - `GET /api/history`
- Super admin:
  - `POST /api/draw/reset`
  - `POST /api/prizes`
  - `PUT /api/prizes/:id`
  - `DELETE /api/prizes/:id`

## Chinese Notes

- 建議每次改獎池前先匯出現況，避免誤操作後無法追溯。
