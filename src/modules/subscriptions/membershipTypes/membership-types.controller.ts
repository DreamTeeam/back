import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MembershipTypesService } from './membership-types.service';
import { CreateMembershipTypeDto } from './dto/create-membership-type.dto';
import { UpdateMembershipTypeDto } from './dto/update-membership-type.dto';

@Controller('membership-types')
export class MembershipTypesController {
  constructor(
    private readonly membershipTypesService: MembershipTypesService,
  ) {}

  @Post()
  create(@Body() createMembershipTypeDto: CreateMembershipTypeDto) {
    return this.membershipTypesService.create(createMembershipTypeDto);
  }

  @Get()
  findAll() {
    return this.membershipTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.membershipTypesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMembershipTypeDto: UpdateMembershipTypeDto,
  ) {
    return this.membershipTypesService.update(id, updateMembershipTypeDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.membershipTypesService.remove(id);
  }
}
