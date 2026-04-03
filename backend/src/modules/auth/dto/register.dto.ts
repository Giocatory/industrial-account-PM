import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password: string;

  @ApiProperty({ example: 'Иванов' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'Иван' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Иванович', required: false })
  @IsString()
  middleName?: string;

  @ApiProperty({ example: 'ООО Промтех' })
  @IsString()
  organization: string;

  @ApiProperty({ example: 'Инженер' })
  @IsString()
  position: string;

  @ApiProperty({ example: '+7 999 123-45-67' })
  @IsString()
  phone: string;
}
