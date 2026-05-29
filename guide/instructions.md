# Project instructions

Tài liệu này mô tả cách làm việc cho SSO core và giai đoạn demo backend multi-project SSO.

## 1. Trước khi coding

1. Đọc [`plans/sso-project-plan.md`](../plans/sso-project-plan.md).
2. Đọc [`plans/demo-backend-multi-project-sso-plan.md`](../plans/demo-backend-multi-project-sso-plan.md).
3. Đọc [`docs/project-ab-integration-strategy.md`](../docs/project-ab-integration-strategy.md).
4. Đọc [`guide/rules.md`](rules.md).
5. Không bắt đầu sửa Project A/B thật nếu chưa có phê duyệt.

## 2. Hướng coding tiếp theo

Giai đoạn tiếp theo không sửa Project A/B thật. Thay vào đó tạo 2 demo backend:

```text
demo-projects/
  demo-project-a-api/
  demo-project-b-api/
```

Mỗi demo backend mô phỏng Project A/B thật:

- Express.js + TypeScript + Node.js.
- Sequelize.
- `express-automatic-routes`.
- DB schema: `users`, `user_auth`, `user_roles`, `roles`, `permissions`, `user_sessions`.
- JWT access token + refresh token.
- HttpOnly cookies.
- Middleware `authenticate` và `validateSession`.
- SSO callback theo Resource object.

## 3. Quy trình developer

1. Tạo hoặc cập nhật branch làm việc từ nhánh phát triển.
2. Chạy SSO local theo [`guide/00-setup-and-run-local-full.md`](00-setup-and-run-local-full.md).
3. Code demo backend theo plan.
4. Chạy typecheck/build cho từng project.
5. Test flow Demo A -> SSO -> Demo A.
6. Test flow Demo B -> SSO -> Demo B.
7. Test mở Demo B sau khi login Demo A để chứng minh SSO session dùng chung.
8. Ghi lại lỗi và cập nhật guide nếu phát hiện bước nào chưa rõ.

## 4. Quy trình DevOps/Admin

- DevOps quản lý secret, DB connection, Docker/Helm/CI-CD.
- Admin onboarding client qua guide OIDC/client registration.
- Không deploy production thủ công ngoài pipeline.
- Không đưa demo secret vào production.

## 5. Tiêu chí trước khi xin duyệt sửa Project A/B thật

- Demo A và Demo B chạy ổn định.
- Multi-project SSO flow pass.
- Session nội bộ của từng demo độc lập.
- SSO audit có log rõ ràng.
- Callback Resource object đã có mẫu rõ ràng.
- Có tài liệu rollback/security khi áp dụng vào Project A/B thật.
