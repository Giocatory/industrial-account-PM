import { IsEmail, IsString, MinLength, MaxLength, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @MinLength(8) password: string;
}

export class VerifyEmailDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @Length(6, 6) code: string;
}

export class ForgotPasswordDto {
  @ApiProperty() @IsEmail() email: string;
}

export class ResetPasswordDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @Length(6, 6) code: string;
  @ApiProperty() @IsString() @MinLength(8) @MaxLength(64) newPassword: string;
}
