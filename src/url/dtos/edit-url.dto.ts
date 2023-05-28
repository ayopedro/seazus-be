import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class EditUrlDto {
  @IsUrl({}, { message: 'Kindly provide a valid URL' })
  @ApiProperty()
  @IsOptional()
  longUrl?: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  title?: string;
}
