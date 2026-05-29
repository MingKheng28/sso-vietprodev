import { IsString, IsUrl } from 'class-validator';
export class TestConnectionDto { @IsString() name!: string; @IsUrl({ require_tld: false, require_protocol: true }) connectionString!: string; }
