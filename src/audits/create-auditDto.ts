
import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAuditDto {
  @ApiProperty({ example: 'Cierre de caja del turno tarde' })
  @IsNotEmpty()
  description: string;
}