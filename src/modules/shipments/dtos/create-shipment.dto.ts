import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateShipmentVariantDto } from './create-shipment-variant.dto';

export class CreateShipmentDto {
  @IsString()
  @IsNotEmpty()
  shipment_code: string;

  @IsDateString()
  @IsNotEmpty()
  shipment_date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateShipmentVariantDto)
  variants: CreateShipmentVariantDto[];
}
