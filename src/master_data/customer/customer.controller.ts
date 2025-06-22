import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
//! TennantService
import { TenantConnectionService } from '../../common/tenant-connection/tenant-connection.service';
import { User } from 'src/modules/users/entities/user.entity';
//! sistema de autorización para admins globales
// import { Roles } from 'src/modules/auth/decorators/roles.decorator';
// import { Role } from 'src/modules/roles/entities/role.entity';
// import { UseGuards } from '@nestjs/common';
// import { RolesGuard } from 'src/modules/auth/guards/roles.guard';

@Controller('customers')
// @UseGuards(RolesGuard)
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    //! Inyección del servicio de tenant service
    private readonly tenantConnectionService: TenantConnectionService,
  ) {}

  @Post()
  // @Roles(Role.SuperAdmin)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.create(createCustomerDto);
  }

  @Get()
  // @Roles(Role.SuperAdmin, Role.Admin)
  findAll() {
    return this.customerService.findAll();
  }

  @Get(':id')
  // @Roles(Role.SuperAdmin, Role.Admin)
  findOne(@Param('id') id: string) {
    return this.customerService.findOne(id);
  }

  @Patch(':id')
  // @Roles(Role.SuperAdmin)
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customerService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  // @Roles(Role.SuperAdmin)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.customerService.remove(id);
  }

  @Get(':id/test-connection')
  async testTenantConnection(@Param('id') id: string) {
    try {
      const dataSource =
        await this.tenantConnectionService.getTenantDataSource(id);
      //TODO consulta simple de prueba a una tabla del tenant
      const userRepository = dataSource.getRepository(User); //FIXME Revisar importación de user en caso de ser necesario
      const userCount = await userRepository.count();
      return { message: `Successfully connected to tenant ${id}. User count: ${userCount}` };
      // return { message: `Successfully connected to tenant ${id}.` };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `Failed to connect to tenant ${id}: ${error.message}`,
      );
    }
  }
}
