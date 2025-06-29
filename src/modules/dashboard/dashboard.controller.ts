import {
  Controller,
  Get,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { IsDateString, IsNumberString, IsOptional } from 'class-validator';

class DateRangeQueryDto {
  @IsDateString()
  startDate: string; // Formato YYYY-MM-DD

  @IsDateString()
  endDate: string; // Formato YYYY-MM-DD --> fijarse bien que la fecha sea al dia de hoy para que traiga los datos completos
}

class YearQueryDto {
  @IsNumberString()
  year: string;
}

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('sales-by-employee')
  getSalesByEmployee(@Query(new ValidationPipe()) query: DateRangeQueryDto) {
    const { startDate, endDate } = query;
    return this.dashboardService.getSalesByEmployee(startDate, endDate);
  }

  @Get('monthly-sales')
  getMonthlySales(@Query(new ValidationPipe()) query: YearQueryDto) {
    const year = parseInt(query.year, 10);
    return this.dashboardService.getMonthlySales(year);
  }

  @Get('financial-summary') // ganancia financiera neta para la empresa teniendo en cuenta precio y precio de venta (lo que vale en venta - lo que vale en neto)
  getFinancialSummary(@Query(new ValidationPipe()) query: DateRangeQueryDto) {
    const { startDate, endDate } = query;
    return this.dashboardService.getFinancialSummary(startDate, endDate);
  }
}
