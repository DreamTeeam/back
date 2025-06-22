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
import { GlobalMembershipTypeService } from './global-membership-type.service';
import { CreateGlobalMembershipTypeDto } from './dto/create-global-membership-type.dto';
import { UpdateGlobalMembershipTypeDto } from './dto/update-global-membership-type.dto';
//! admins globales
// import { Roles } from 'src/modules/auth/decorators/roles.decorator';
// import { Role } from 'src/modules/roles/entities/role.entity';
// import { UseGuards } from '@nestjs/common';
// import { RolesGuard } from 'src/modules/auth/guards/roles.guard';

@Controller('global-membership-types')
// @UseGuards(RolesGuard)
export class GlobalMembershipTypeController {
  constructor(
    private readonly globalMembershipTypeService: GlobalMembershipTypeService,
  ) {}

  @Post()
  // @Roles(Role.SuperAdmin)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateGlobalMembershipTypeDto) {
    return this.globalMembershipTypeService.create(createDto);
  }

  @Get()
  // @Roles(Role.SuperAdmin, Role.Admin)
  findAll() {
    return this.globalMembershipTypeService.findAll();
  }

  @Get(':id')
  // @Roles(Role.SuperAdmin, Role.Admin)
  findOne(@Param('id') id: string) {
    return this.globalMembershipTypeService.findOne(id);
  }

  @Patch(':id')
  // @Roles(Role.SuperAdmin)
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateGlobalMembershipTypeDto,
  ) {
    return this.globalMembershipTypeService.update(id, updateDto);
  }

  @Delete(':id')
  // @Roles(Role.SuperAdmin)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.globalMembershipTypeService.remove(id);
  }
}
