import { IsArray, IsDateString, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateShipmentVariantDto } from './create-shipment-variant.dto';

export class CreateShipmentDto {
  @IsString()
  @IsNotEmpty()
  shipmentCode: string;

  @IsDateString()
  @IsNotEmpty()
  shipmentDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateShipmentVariantDto)
  variants: CreateShipmentVariantDto[];
}
