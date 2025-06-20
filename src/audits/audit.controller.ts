import { Controller, Post, Body, Put, Param, Get, ParseIntPipe, Delete } from '@nestjs/common';
import { AuditService } from './audit.sevice';
import { CreateAuditDto } from './create-auditDto';
import { UpdateAuditDto } from './update-auditDto';

@Controller('audits')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post()
  create(@Body() createAuditDto: CreateAuditDto) {
    return this.auditService.create(createAuditDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateAuditDto: UpdateAuditDto) {
    return this.auditService.update(id, updateAuditDto);
  }

  @Get()
findAll() {
  return this.auditService.findAll();
}

 @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.auditService.remove(id);
  }
}
