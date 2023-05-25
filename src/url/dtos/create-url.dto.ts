import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateUrlDto {
  @IsUrl({}, { message: 'Kindly provide a valid URL' })
  @ApiProperty()
  longUrl: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  customDomain?: string;
}
