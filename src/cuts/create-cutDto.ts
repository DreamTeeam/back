import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCutDto {
  @IsString()
  @IsNotEmpty()
  description: string;
}


// export class CreateCutDto {
//   date: string;
//   time: string;
//   auditCount: number;
//   totalAudits: number;
//   saleCount: number;
//   totalCashSales: number;
//   description: string;
//   employeeId: number;
// }
