import { Injectable } from '@nestjs/common';
import { SsoPoolService } from '../database/postgres/sso-pool.service';

export interface ActiveClientSummary {
  id: string;
  app_code: string;
  name: string;
  status: string;
  created_at: Date;
}

export interface OidcClientRecord {
  id: string;
  app_code: string;
  client_id: string;
  client_secret_hash?: string | null;
  name: string;
  redirect_uris: string[];
  post_logout_redirect_uris: string[];
  grant_types: string[];
  response_types: string[];
  scopes: string[];
  token_endpoint_auth_method: string;
  require_pkce: boolean;
  status: string;
  created_at: Date;
}

@Injectable()
export class ClientsRepository {
  constructor(private readonly db: SsoPoolService) {}

  async findOidcClient(clientId: string): Promise<OidcClientRecord | undefined> {
    const result = await this.db.query<OidcClientRecord>('SELECT * FROM clients WHERE client_id=$1 OR app_code=$1 LIMIT 1', [clientId]);
    return result.rows[0];
  }

  async listActive(): Promise<ActiveClientSummary[]> {
    const result = await this.db.query<ActiveClientSummary>('SELECT id,app_code,name,status,created_at FROM clients WHERE status=$1 ORDER BY name', ['active']);
    return result.rows;
  }

  async listActiveOidcClients(): Promise<OidcClientRecord[]> {
    const result = await this.db.query<OidcClientRecord>(
      `SELECT id, app_code, client_id, client_secret_hash, name, redirect_uris, post_logout_redirect_uris,
              grant_types, response_types, scopes, token_endpoint_auth_method, require_pkce, status, created_at
       FROM clients
       WHERE status=$1
       ORDER BY name`,
      ['active'],
    );

    return result.rows;
  }
}
