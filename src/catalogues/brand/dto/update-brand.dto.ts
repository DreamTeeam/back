import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateBrandDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  key?: string;

  @IsString()
  @IsOptional()
  image?: string;
}
