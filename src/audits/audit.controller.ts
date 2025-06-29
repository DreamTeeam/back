import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  ParseIntPipe,
  Delete,
  Req,
} from '@nestjs/common';
import { AuditService } from './audit.sevice';
import { CreateAuditDto } from './create-auditDto';
import { UpdateAuditDto } from './update-auditDto';
import { Request } from 'express';

@Controller('audits')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  getAll() {
    return this.auditService.findAll();
  }

  @Post()
  create(@Body() dto: CreateAuditDto, @Req() req: Request) {  // @Req() req: Request   
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN
    return this.auditService.create(dto, token);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: string,
    @Body() updateDto: UpdateAuditDto,
  ) {
    return this.auditService.update(id, updateDto);
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: string) {
    return this.auditService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: string) {
    return this.auditService.remove(id);
  }
}
