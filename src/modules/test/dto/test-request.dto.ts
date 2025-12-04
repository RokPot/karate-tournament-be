import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsEmail, MinLength, MaxLength } from 'class-validator';

export class TestRequestDto {
  @Expose()
  @ApiProperty({
    description: 'Name of the test user',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Optional message',
    example: 'Hello from Swagger!',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
