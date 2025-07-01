import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCutDto {
  @ApiProperty({ example: 'Cierre de caja del turno mañana' })
  @IsString()
  description: string;
}