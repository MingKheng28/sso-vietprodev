import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DbManagerModule } from '../db-manager/db-manager.module';
import { ProjectUserMappingService } from './project-user-mapping.service';
import { ProjectUserReaderService } from './project-user-reader.service';

@Module({
  imports: [DatabaseModule, DbManagerModule],
  providers: [ProjectUserMappingService, ProjectUserReaderService],
  exports: [ProjectUserMappingService, ProjectUserReaderService],
})
export class ProjectIntegrationsModule {}
