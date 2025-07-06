import { IsArray, IsNumber, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateShipmentSizeDto } from './create-shipment-size.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShipmentVariantDto {
  @ApiProperty({ example: 101 })
  @IsNumber()
  @IsNotEmpty()
  variant_id: string;

  @ApiProperty({ type: [CreateShipmentSizeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateShipmentSizeDto)
  sizes: CreateShipmentSizeDto[];
}





