import { IsDate, IsOptional, IsString } from 'class-validator';

export class ClickDto {
  @IsDate()
  timestamp: Date;

  @IsString()
  @IsOptional()
  device?: string;

  @IsString()
  @IsOptional()
  os?: string;

  @IsString()
  @IsOptional()
  browser?: string;

  @IsString()
  ipAddress: string;
}
