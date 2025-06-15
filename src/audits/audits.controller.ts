import { Controller, Post, Body, Get, Put, Param } from '@nestjs/common';
import { AuditService } from './audit.sevice';
import { CreateAuditDto } from './create-auditDto';
import { UpdateAuditDto } from './update-auditDto';
@Controller('audits')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

@Get()
getAll() {
    return this.auditService.findAll();
}

 @Put(':id')
  update(@Param('id') id: string, @Body() updateAuditDto: UpdateAuditDto) {
    return this.auditService.update(id, updateAuditDto);
  }


  @Post()
  create(@Body() createAuditDto: CreateAuditDto) {
    return this.auditService.create(createAuditDto);
  }
}