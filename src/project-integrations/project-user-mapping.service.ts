import { Injectable } from '@nestjs/common';
import { SsoPoolService } from '../database/postgres/sso-pool.service';
@Injectable()
export class ProjectUserMappingService { constructor(private readonly db: SsoPoolService) {} async listForUser(userId: string) { const result = await this.db.query('SELECT * FROM user_app_mappings WHERE sso_user_id=$1', [userId]); return result.rows; } }
