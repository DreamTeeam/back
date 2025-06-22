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
} from '@nestjs/common';
import { CompanySubscriptionService } from './company-subscription.service';
import { CreateCompanySubscriptionDto } from './dto/create-company-subscription.dto';
import { UpdateCompanySubscriptionDto } from './dto/update-company-subscription.dto';
//! roles para admins globales
// import { Roles } from 'src/modules/auth/decorators/roles.decorator';
// import { Role } from 'src/modules/roles/entities/role.entity';
// import { UseGuards } from '@nestjs/common';
// import { RolesGuard } from 'src/modules/auth/guards/roles.guard';

@Controller('company-subscriptions')
// @UseGuards(RolesGuard)
export class CompanySubscriptionController {
  constructor(
    private readonly companySubscriptionService: CompanySubscriptionService,
  ) {}

  @Post()
  // @Roles(Role.SuperAdmin)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateCompanySubscriptionDto) {
    return this.companySubscriptionService.create(createDto);
  }

  @Get()
  // @Roles(Role.SuperAdmin, Role.Admin)
  findAll() {
    return this.companySubscriptionService.findAll();
  }

  @Get(':id')
  // @Roles(Role.SuperAdmin, Role.Admin)
  findOne(@Param('id') id: string) {
    return this.companySubscriptionService.findOne(id);
  }

  @Get('customer/:customerId/active')
  // @Roles(Role.SuperAdmin, Role.Admin)
  findActiveForCustomer(@Param('customerId') customerId: string) {
    return this.companySubscriptionService.findActiveSubscriptionForCustomer(
      customerId,
    );
  }

  @Patch(':id')
  // @Roles(Role.SuperAdmin)
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCompanySubscriptionDto,
  ) {
    return this.companySubscriptionService.update(id, updateDto);
  }

  @Delete(':id')
  // @Roles(Role.SuperAdmin)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.companySubscriptionService.remove(id);
  }
}
