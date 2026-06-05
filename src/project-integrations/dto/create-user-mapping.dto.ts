import { IsString, IsUUID } from 'class-validator';
export class CreateUserMappingDto { @IsUUID() ssoUserId!: string; @IsUUID() clientId!: string; @IsString() externalUserId!: string; }
