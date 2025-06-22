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
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string; 

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  price: number; 

  @IsObject()
  @IsOptional()
  features_json?: Record<string, any>; 
}
