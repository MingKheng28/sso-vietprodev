# Secrets

Thư mục này chứa development secrets (JWKS keys cho local development). **Không commit production secrets.**

## JWKS Files

| File | Mục đích | Dev |
|---|---|---|
| `oidc-jwks.json` | Public JWKS - có thể commit | Chỉ dùng cho dev |
| `oidc-private.jwk.json` | Private key - **KHÔNG commit** | Chỉ dùng cho dev |

## Quy tắc

1. **Development**: Dùng JWKS trong thư mục này để dev local. Đã ignore trong `.gitignore` (nếu dùng).
2. **Staging/Production**: Sinh JWKS mới bằng `npm run jwks:generate`, lưu trong secret store (Kubernetes Secret, AWS Secrets Manager, v.v.).
3. **Không dùng chung JWKS** giữa các môi trường.
4. **Key rotation**: Xoay JWKS định kỳ và notify clients.

## Sinh JWKS mới

```bash
npm run jwks:generate
```

## Production Secret Management

Trong production, không dùng file system cho secrets. Dùng:

- **Kubernetes Secret**: mount vào container tại `/run/secrets/`
- **AWS Secrets Manager**: fetch bằng init container hoặc CSI driver
- **Azure Key Vault**: dùng Azure Key Vault Provider for Secrets Store CSI Driver

Ví dụ Kubernetes Secret:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: sso-api-jwks
  namespace: sso-prod
type: Opaque
stringData:
  oidc-private.jwk.json: |
    {
      "kty": "RSA",
      "kid": "...",
      "p": "...",
      ...
    }
```
