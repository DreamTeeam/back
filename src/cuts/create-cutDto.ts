import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCutDto {
  @ApiProperty({ example: 'Cierre de caja del turno mañana' })
  @IsString()
  description: string;
}






// import {
//   IsInt,
//   IsString,
//   IsDateString,
//   IsMilitaryTime,
//   IsNumber,
//   Min,
// } from 'class-validator';
// import { ApiProperty } from '@nestjs/swagger';

// export class CreateCutDto {
//   @ApiProperty({ example: '2025-06-28' })
//   @IsDateString()
//   date: string;

//   @ApiProperty({ example: '18:30:00' })
//   @IsMilitaryTime()
//   time: string;

//   @ApiProperty({ example: 3 })
//   @IsInt()
//   @Min(0)
//   audit_count: number;

//   @ApiProperty({ example: 15000.5 })
//   @IsNumber()
//   total_audits: number;

//   @ApiProperty({ example: 10 })
//   @IsInt()
//   @Min(0)
//   sale_count: number;

//   @ApiProperty({ example: 30000.0 })
//   @IsNumber()
//   total_cash_sales: number;

//   @ApiProperty({ example: 'Cierre de caja del turno mañana' })
//   @IsString()
//   description: string;

//   @ApiProperty({ example: 2 })
//   @IsInt()
//   @Min(0)
//   expense_count: number;

//   @ApiProperty({ example: 4500.75 })
//   @IsNumber()
//   total_expenses: number;

  
// }






