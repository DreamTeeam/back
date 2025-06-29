import { IsUUID, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateAuditDto {
  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  totalCash: number;

  @IsUUID()
  @IsOptional()
  employeeId?: string;
}
