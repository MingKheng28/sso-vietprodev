import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
export class CreateUserDto { @IsEmail() email!: string; @IsOptional() @IsString() username?: string; @IsString() @MinLength(12) password!: string; }
