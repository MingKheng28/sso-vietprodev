import { Injectable } from '@nestjs/common';
@Injectable()
export class PatroniHealthService { async check() { return { name: 'patroni', status: process.env.PATRONI_API_URL ? 'configured' : 'not_configured' }; } }
