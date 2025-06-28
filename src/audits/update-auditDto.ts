import { IsOptional, IsString } from 'class-validator';

export class UpdateAuditDto {
  @IsOptional()
  @IsString()
  description?: string;
}
