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
import { ApiProperty } from '@nestjs/swagger';

export class ProductOrderDto {
  @ApiProperty({ example: 'c735b720-84a0-4625-a94e-7f994f1e0a11' })
  @IsUUID()
  @IsNotEmpty()
  variant_id: string;

  @ApiProperty({ example: '1' })
  @IsInt()
  quantity: number;

  @ApiProperty({ example: 'c735b720-84a0-4625-a94e-7f994f1e0a11' })
  @IsUUID()
  @IsNotEmpty()
  size_id: string;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'email' })
  @IsOptional()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'c735b720-84a0-4625-a94e-7f994f1e0a11' })
  @IsUUID()
  @IsNotEmpty()
  employee_id: string;

  @ApiProperty({ example: 'c735b720-84a0-4625-a94e-7f994f1e0a11' })
  @IsOptional()
  customer_id?: string;

  @ApiProperty({ example: 'Efectivo' })
  @IsString()
  @IsIn(['Efectivo', 'Tarjeta'])
  payment_method: 'Efectivo' | 'Tarjeta';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOrderDto)
  products: ProductOrderDto[];
}
