import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim().toLowerCase())
  name?: string;

  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional() // NACHO
  @IsString()
  slug?: string;
}
