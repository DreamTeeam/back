import { IsOptional, IsNumber, IsString, IsInt, IsNotEmpty } from 'class-validator';

export class CreateAuditDto {
  @IsOptional()
  @IsNumber()
  totalCashSales?: number;

  @IsOptional()
  @IsNumber()
  totalCardSales?: number;

  @IsOptional()
  @IsNumber()
  totalTransferSales?: number;

  @IsOptional()
  @IsInt()
  saleCount?: number;

  @IsOptional()
  @IsNumber()
  totalCash?: number;  // <-- ahora opcional

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  time: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsInt()
  @IsNotEmpty()
  employeeId: number;

  @IsOptional()
  @IsInt()
  cutId?: number;
}
