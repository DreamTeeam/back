import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateOrderDto {
  @ApiProperty({ example: 'Cancelada' })
  @IsString()
  @IsOptional()
  status?: string;
}
