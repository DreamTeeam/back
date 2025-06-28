import {
  IsInt,
  IsString,
  IsDateString,
  IsMilitaryTime,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateCutDto {
  @IsDateString()
  date: string;

  @IsMilitaryTime()
  time: string;

  @IsInt()
  @Min(0)
  auditCount: number;

  @IsNumber()
  totalAudits: number;

  @IsInt()
  @Min(0)
  saleCount: number;

  @IsNumber()
  totalCashSales: number;

  @IsString()
  description: string;

  @IsInt()
  @Min(0)
  expenseCount: number;

  @IsNumber()
  totalExpenses: number;

  @IsString()
  employeeId: string;
}
