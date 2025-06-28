import { IsUUID, IsNotEmpty, IsString } from 'class-validator';

export class CreateAuditDto {
  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  totalCash: number;

  @IsUUID()
  @IsNotEmpty()
  employeeId: string;
}
