import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsUrl,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Nombre de la empresa',
    example: 'Zapateria Florencia',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Slug único para la URL de la empresa',
    example: 'zapateria-florencia',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  slug: string;

  @ApiProperty({
    description: 'direccion de la empresa',
    example: 'Calle Falsa 123',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'Numero telefonico de la empresa',
    example: '4955-8899',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone_number?: string;

  @ApiProperty({
    description: 'Email de la empresa',
    example: 'zapateria@mail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'Url unico de conexion a la base de datos',
    example: 'postgres://postgres:clave@localhost:5432/zapateria-florencia',
  })
  @IsString()
  @IsNotEmpty()
  db_connection_string: string;
}
