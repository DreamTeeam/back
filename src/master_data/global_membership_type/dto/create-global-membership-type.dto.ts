import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsNumber,
  Min,
  IsOptional,
  IsObject,
} from 'class-validator';

export class CreateGlobalMembershipTypeDto {
  @ApiProperty({
    description: 'Nombre del tipo de membresía de empresa',
    example: 'Plan Básico',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Descripción breve de la membresia',
    example: 'Membresia basica ',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Precio mensual de la membresía',
    example: 29.99,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Descripción detallada de lo que incluye la membresia',
    example: 'Acceso a funciones básicas y soporte por correo',
  })
  @IsObject()
  @IsOptional()
  features_json?: Record<string, any>;
}
