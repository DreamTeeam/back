import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShipmentSizeDto {
  @ApiProperty({ example: 42 })
  @IsNumber()
  @IsNotEmpty()
  size_id: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @IsNotEmpty()
  stock: number;
}









