import { IsArray, IsString } from 'class-validator';
export class CreateClientDto { @IsString() appCode!: string; @IsString() name!: string; @IsArray() redirectUris!: string[]; }
