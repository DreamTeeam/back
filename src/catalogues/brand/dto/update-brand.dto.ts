import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateBrandDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim().toLowerCase())
  name?: string;

  @IsString()
  @IsOptional()
  key?: string;

  @IsString()
  @IsOptional()
  image?: string;
}
