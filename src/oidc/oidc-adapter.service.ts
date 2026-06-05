import { Injectable } from '@nestjs/common';
import { SsoPoolService } from '../database/postgres/sso-pool.service';

@Injectable()
export class OidcAdapterService {
  constructor(private readonly db: SsoPoolService) {}

  createAdapter(name: string) {
    const db = this.db;

    class PgOidcAdapter {
      async upsert(id: string, payload: any, expiresIn: number) {
        await db.query(
          `INSERT INTO oidc_grants(model, id, payload, expires_at)
           VALUES($1, $2, $3, NOW() + ($4 || ' seconds')::interval)
           ON CONFLICT(model, id)
           DO UPDATE SET payload = $3, expires_at = NOW() + ($4 || ' seconds')::interval`,
          [name, id, payload, expiresIn],
        );
      }

      async find(id: string) {
        const result = await db.query(
          `SELECT payload
           FROM oidc_grants
           WHERE model = $1
             AND id = $2
             AND (expires_at IS NULL OR expires_at > NOW())`,
          [name, id],
        );
        return result.rows[0]?.payload;
      }

      async findByUserCode(userCode: string) {
        const result = await db.query(
          `SELECT payload
           FROM oidc_grants
           WHERE model = $1
             AND payload->>'userCode' = $2
             AND (expires_at IS NULL OR expires_at > NOW())`,
          [name, userCode],
        );
        return result.rows[0]?.payload;
      }

      async findByUid(uid: string) {
        const result = await db.query(
          `SELECT payload
           FROM oidc_grants
           WHERE model = $1
             AND payload->>'uid' = $2
             AND (expires_at IS NULL OR expires_at > NOW())`,
          [name, uid],
        );
        return result.rows[0]?.payload;
      }

      async destroy(id: string) {
        await db.query('DELETE FROM oidc_grants WHERE model = $1 AND id = $2', [name, id]);
      }

      async revokeByGrantId(grantId: string) {
        await db.query("DELETE FROM oidc_grants WHERE payload->>'grantId' = $1", [grantId]);
      }

      async consume(id: string) {
        await db.query(
          `UPDATE oidc_grants
           SET payload = jsonb_set(payload, '{consumed}', to_jsonb(EXTRACT(EPOCH FROM NOW())::bigint))
           WHERE model = $1 AND id = $2`,
          [name, id],
        );
      }
    }

    return new PgOidcAdapter();
  }
}
