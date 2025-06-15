import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'ropa deportiva' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim().toLowerCase())
  name: string;

  @ApiProperty({ example: 'RD0033' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'https://miapp.com/images/ropa-deportiva.jpg' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  image: string;
}
