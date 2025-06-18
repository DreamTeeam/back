import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateProductVariantDto {
  @ApiProperty({ example: 'Talla 40, color negro' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Negro' })
  @IsString()
  @IsOptional()
  color: string;

  @ApiProperty({ example: 25 })
  @IsNumber()
  @IsNotEmpty()
  stock: number;

  @ApiProperty({ example: ['6a271a27-6fb1-4d7a-b921-674e244e3c8a'] })
  @IsString()
  @IsNotEmpty()
  size_id: string;

  @IsString()
  @IsOptional()
  product_id?: string;
}