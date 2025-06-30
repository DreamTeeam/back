import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateShipmentVariantDto } from './create-shipment-variant.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShipmentDto {
  @ApiProperty({ example: 'EMB-2025-001' })
  @IsString()
  @IsNotEmpty()
  shipment_code: string;

  @ApiProperty({ example: '2025-06-28' })
  @IsDateString()
  @IsNotEmpty()
  shipment_date: string;

  @ApiProperty({ type: [CreateShipmentVariantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateShipmentVariantDto)
  variants: CreateShipmentVariantDto[];
}





