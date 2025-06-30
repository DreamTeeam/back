
import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAuditDto {
  @ApiProperty({ example: 'Cierre de caja del turno tarde' })
  @IsNotEmpty()
  description: string;

  // @ApiProperty({ example: 15000.5 })
  // @IsNotEmpty()
  // totalCash: number;

  // @ApiProperty({ example: 'f4a93f98-4a4d-4d98-8e6a-1b8768d7bd5a' })
  // @IsUUID()
  // @IsNotEmpty()
  // employeeId: string;
}






