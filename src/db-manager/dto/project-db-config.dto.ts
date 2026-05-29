import { IsString } from 'class-validator';
export class ProjectDbConfigDto { @IsString() appCode!: string; @IsString() connectionStringEnv!: string; @IsString() userTable!: string; @IsString() userIdColumn!: string; @IsString() emailColumn!: string; }
