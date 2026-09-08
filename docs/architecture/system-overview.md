---
owner: backend
status: draft
updated_at: 2026-06-02
---

# System Overview

## Stack

- Frontend: Next.js 14 (App Router)
- Backend: NestJS 10 + Mongoose
- Database: MongoDB 7
- Realtime: Socket.IO
- Reverse Proxy: Nginx

## Runtime Topology

- Browser -> Nginx (`:80`)
- Nginx -> Frontend container (`frontend:5012`)
- Nginx -> Backend container (`backend:5022`)
- Backend -> MongoDB container (`mongo:27017`)

## Core Domains

- `auth`: login, SSO callback, session cookie lifecycle
- `draw`: draw execution, quota checks, history, recent broadcast feed
- `prizes`: public prize list and super-admin prize CRUD
- `users`: user profile and role support

## Auth Model

- Cookie-based auth token (`bb_token`)
- `JwtAuthGuard` protects authenticated APIs
- `SuperAdminGuard` protects privileged APIs

## Deployment Model

VM deployment uses:
- `deploy/docker-compose.vm.yml`
- `deploy/backend.Dockerfile`
- `deploy/frontend.Dockerfile`
- `deploy/nginx.conf`

## Chinese Notes

- 目前是單機 VM 架構，若要水平擴展，需補 Socket.IO adapter 與 session 策略。
