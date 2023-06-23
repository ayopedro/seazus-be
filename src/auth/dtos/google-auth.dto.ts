import { IsEmail, IsOptional, IsString, ValidateNested } from 'class-validator';

export class GoogleAuthDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;
}

class GoogleEmailDto {
  @IsEmail()
  value: string;
}

class GoogleProfileDto {
  @ValidateNested()
  name: {
    givenName: string;
    familyName: string;
  };

  @ValidateNested({ each: true })
  emails: GoogleEmailDto[];
}

export class GoogleCredentialsDto {
  @IsString()
  accessToken: string;

  @IsString()
  refreshToken: string;

  @ValidateNested()
  profile: GoogleProfileDto;
}
