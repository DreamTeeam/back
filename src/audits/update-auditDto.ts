import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAuditDto {
  @ApiPropertyOptional({ example: 'Cierre corregido del turno noche' })
  @IsOptional()
  @IsString()
  description?: string;
}