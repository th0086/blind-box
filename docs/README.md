---
owner: product-engineering
status: draft
updated_at: 2026-06-02
---

# Documentation Index

## Reading Order

1. [System Overview](architecture/system-overview.md)
2. [Product Spec (EN)](product/game-spec.md)
3. [Product Spec (ZH)](product/game-spec-zh.md)
4. [API Endpoints](api/endpoints.md)
5. [Admin Playbook](admin/admin-playbook.md)
6. [Local Development](operations/local-dev.md)
7. [VM Deployment](operations/vm-deploy.md)
8. [Changelog](changelog/CHANGELOG.md)

## Documentation Rules

- English-first docs; Chinese companion files use `-zh` suffix.
- Keep deployment contracts in docs, not only in code comments.
- Update `updated_at` after meaningful content changes.
- Every API endpoint doc should include purpose, auth, request, response, and error cases.

## Chinese Notes

- 文件以英文為主，必要補充使用中文段落。
- 上 VM 前請先依 `operations/vm-deploy.md` 逐項檢查。
