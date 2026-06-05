import { Injectable } from '@nestjs/common';
@Injectable()
export class HaproxyHealthService { async check() { return { name: 'haproxy', status: process.env.HAPROXY_STATS_URL ? 'configured' : 'not_configured' }; } }
