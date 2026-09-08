---
owner: product-engineering
status: draft
updated_at: 2026-06-02
---

# Changelog

## 2026-06-02

- Standardized VM deployment layout to `deploy/`.
- Added `deploy/docker-compose.vm.yml` as canonical VM compose file.
- Moved Dockerfiles and nginx config into `deploy/`.
- Added docs hierarchy (`architecture`, `api`, `admin`, `operations`, `product`, `changelog`).
- Added backend health endpoint `/api/health`.
