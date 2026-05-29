import { IsEmail, IsString } from 'class-validator';
export class ProjectUserQueryDto { @IsString() appCode!: string; @IsEmail() email!: string; }
