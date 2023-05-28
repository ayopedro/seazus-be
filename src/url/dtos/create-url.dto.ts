import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateUrlDto {
  @IsUrl({}, { message: 'Kindly provide a valid URL' })
  @ApiProperty()
  @IsNotEmpty()
  longUrl: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  customDomain?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  title?: string;
}
