import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
@Injectable()
export class SessionService { createSession(userId: string) { return { id: randomUUID(), userId, createdAt: new Date() }; } }
