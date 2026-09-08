---
owner: product
status: draft
updated_at: 2026-06-02
---

# Game Spec (EN)

## Core Loop

1. User logs in (password or SSO).
2. User checks remaining daily draw quota.
3. User performs blind-box draw.
4. System returns prize result and updates history.

## Rules

- Daily draw quota is controlled by `DAILY_DRAW_LIMIT`.
- Quota is consumed on successful draw calls.
- Draw history is visible to authenticated user.

## Roles

- `user`: draw and view own history.
- `super_admin`: manage prizes and reset draw quota.

## Non-Goals (Current Version)

- Multi-tenant isolation.
- Multi-node websocket scaling.
- Full audit export pipeline.

## Chinese Notes

- 當前版本以單活動場景為主，若要多活動需先擴充資料模型與管理介面。
