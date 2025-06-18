import {
  Controller,
  Put,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EmployeesService } from './employees.service';
import { UpdateEmployeeRolesDto } from './dto/update-employee-roles.dto';

@Controller('employees')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Put(':id/roles')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  updateRoles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEmployeeRolesDto: UpdateEmployeeRolesDto,
  ) {
    return this.employeesService.updateEmployeeRoles(
      id,
      updateEmployeeRolesDto,
    );
  }
}
