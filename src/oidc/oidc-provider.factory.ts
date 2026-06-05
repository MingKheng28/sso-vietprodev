import { Injectable } from '@nestjs/common';
import Provider from 'oidc-provider';
import { OidcClientRecord } from '../clients/clients.repository';
import { OidcConfigService } from '../config/oidc-config.service';
import { OidcAdapterService } from './oidc-adapter.service';
import { OidcClaimsService } from './oidc-claims.service';

@Injectable()
export class OidcProviderFactory {
  constructor(
    private readonly config: OidcConfigService,
    private readonly adapter: OidcAdapterService,
    private readonly claims: OidcClaimsService,
  ) {}

  create(clients: OidcClientRecord[]) {
    const claimsService = this.claims;

    return new Provider(this.config.issuer, {
      adapter: (name) => this.adapter.createAdapter(name),
      clients: clients.map((client) => this.toProviderClient(client)) as any,
      cookies: { keys: this.config.cookieKeys },
      claims: {
        openid: ['sub'],
        profile: ['name', 'preferred_username'],
        email: ['email', 'email_verified'],
      },
      async findAccount(_ctx, sub) {
        return {
          accountId: sub,
          async claims(_use, _scope) {
            return claimsService.claims('', sub);
          },
        };
      },
      ttl: { AccessToken: this.config.accessTokenTtl, RefreshToken: this.config.refreshTokenTtl },
      features: {
        devInteractions: { enabled: false },
        introspection: { enabled: true },
        revocation: { enabled: true },
        rpInitiatedLogout: { enabled: true },
      },
      routes: {
        authorization: '/oauth/authorize',
        token: '/oauth/token',
        userinfo: '/oauth/userinfo',
        jwks: '/oauth/jwks',
        introspection: '/oauth/introspect',
        revocation: '/oauth/revoke',
        end_session: '/oauth/logout',
      },
      interactions: { url: (_ctx, interaction) => `/oidc/interaction/${interaction.uid}` },
    });
  }

  private toProviderClient(client: OidcClientRecord) {
    const providerClient: Record<string, unknown> = {
      client_id: client.client_id,
      client_name: client.name,
      redirect_uris: client.redirect_uris,
      post_logout_redirect_uris: client.post_logout_redirect_uris,
      grant_types: client.grant_types,
      response_types: client.response_types,
      scope: client.scopes.join(' '),
      token_endpoint_auth_method: client.token_endpoint_auth_method,
      require_pkce: client.require_pkce,
    };

    if (client.token_endpoint_auth_method !== 'none' && client.client_secret_hash) {
      providerClient.client_secret = client.client_secret_hash;
    }

    return providerClient;
  }
}
