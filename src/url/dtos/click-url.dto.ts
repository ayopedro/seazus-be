import { IsDate, IsString } from 'class-validator';

export class ClickDto {
  @IsDate()
  timestamp: Date;

  @IsString()
  userAgent: string;

  @IsString()
  ipAddress: string;
}
