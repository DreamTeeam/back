import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
  IsArray,
  IsNotEmpty,
  IsIn,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductOrderDto {
  @IsUUID()
  @IsNotEmpty()
  variant_id: string;

  @IsInt()
  quantity: number;
}

export class CreateOrderDto {
  @IsOptional()
  @IsEmail()
  email: string;

  @IsUUID()
  @IsNotEmpty()
  employee_id: string;

  @IsString()
  @IsIn(['Efectivo', 'Tarjeta'])
  payment_method: 'Efectivo' | 'Tarjeta';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOrderDto)
  products: ProductOrderDto[];
}
