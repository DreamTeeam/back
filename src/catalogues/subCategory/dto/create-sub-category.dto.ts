import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsUUID, IsNotEmpty, IsUrl } from 'class-validator';

export class CreateSubCategoryDto {
  @ApiProperty({ example: 'zapatillas running' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim().toLowerCase())
  name: string;

  @ApiProperty({ example: 'ZR-NIKE-001' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'https://miapp.com/images/zapatillas-nike-running.jpg' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  image: string;

  @ApiProperty({ example: ['6a271a27-6fb1-4d7a-b921-674e244e3c8a'] })
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  categories: string[];
}
