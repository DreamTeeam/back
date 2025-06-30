import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { SizeService } from './size-product.service';
import { CreateSizeDto } from './dto/create-size.dto';
import { UpdateSizeDto } from './dto/update-size.dto';
import { AutoAudit } from '../../modules/auditModification/decorator/audit-log.decorator';

@Controller('sizes')
export class SizeController {
  constructor(private readonly sizeService: SizeService) {}

  @AutoAudit()
  @Post()
  create(@Body() createDto: CreateSizeDto) {
    return this.sizeService.create(createDto);
  }

  @Get()
  findAll() {
    return this.sizeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.sizeService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateDto: UpdateSizeDto,
  ) {
    return this.sizeService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.sizeService.remove(id);
  }
}
