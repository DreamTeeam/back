import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsIn,
} from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'mail@correo.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'mail@correo.com' })
  @IsString()
  @IsNotEmpty()
  price_id: string; // aca va a tomar cualquier tipo de membresia, ya sea de cliente final o Company,

  @IsString()
  @IsNotEmpty()
  @IsIn(['customer', 'client'])
  context: 'customer' | 'client';

  @IsString()
  @IsOptional()
  first_name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;
}
