import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateSizeDto {
  @ApiProperty({ example: 8.5 })
  @IsNumber()
  @IsNotEmpty()
  size_us: number;

  @IsNotEmpty()
  @ApiProperty({ example: 42 })
  @IsNumber()
  size_eur: number;

  @IsNotEmpty()
  @ApiProperty({ example: 26.5 })
  @IsNumber()
  size_cm: number;
}