import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  findByEmail(email: string) {
    return this.repo.findByEmail(email);
  }

  findByUsername(username: string) {
    return this.repo.findByUsername(username);
  }

  findById(id: string) {
    return this.repo.findById(id);
  }

  async create(data: { email: string; username: string; password_hash: string }) {
    return this.repo.create(data);
  }
}
