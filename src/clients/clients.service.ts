import { Injectable } from '@nestjs/common';
import { ActiveClientSummary, ClientsRepository, OidcClientRecord } from './clients.repository';

@Injectable()
export class ClientsService {
  constructor(private readonly repo: ClientsRepository) {}

  findOidcClient(id: string): Promise<OidcClientRecord | undefined> {
    return this.repo.findOidcClient(id);
  }

  listActive(): Promise<ActiveClientSummary[]> {
    return this.repo.listActive();
  }

  listActiveOidcClients(): Promise<OidcClientRecord[]> {
    return this.repo.listActiveOidcClients();
  }
}
