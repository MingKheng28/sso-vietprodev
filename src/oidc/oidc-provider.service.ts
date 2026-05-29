import { Injectable, OnModuleInit } from '@nestjs/common';
import Provider from 'oidc-provider';
import { ClientsService } from '../clients/clients.service';
import { OidcProviderFactory } from './oidc-provider.factory';

@Injectable()
export class OidcProviderService implements OnModuleInit {
  private provider!: Provider;

  constructor(
    private readonly factory: OidcProviderFactory,
    private readonly clients: ClientsService,
  ) {}

  async onModuleInit() {
    const activeClients = await this.clients.listActiveOidcClients();
    this.provider = this.factory.create(activeClients);
  }

  get instance() {
    return this.provider;
  }

  callback() {
    return this.provider.callback();
  }
}
