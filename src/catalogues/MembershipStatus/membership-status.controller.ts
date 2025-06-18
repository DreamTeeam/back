import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MembershipStatusService } from './membership-status.service';
import { CreateMembershipStatusDto } from './dto/create-membership-status.dto';
import { UpdateMembershipStatusDto } from './dto/update-membership-status.dto';

@Controller('membership-status')
export class MembershipStatusController {
  constructor(
    private readonly membershipStatusService: MembershipStatusService,
  ) {}

  @Post()
  create(@Body() dto: CreateMembershipStatusDto) {
    return this.membershipStatusService.create(dto);
  }

  @Get()
  findAll() {
    return this.membershipStatusService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.membershipStatusService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateMembershipStatusDto) {
    return this.membershipStatusService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.membershipStatusService.delete(id);
  }
}