import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { CutsService } from './cut.service';
import { CreateCutDto } from './create-cutDto';
import { UpdateCutDto } from './update-cutDto';

@Controller('cuts')
export class CutsController {
  constructor(private readonly cutsService: CutsService) {}

  @Post()
  create(@Body() dto: CreateCutDto) {
    return this.cutsService.create(dto);
  }

  @Get()
  findAll() {
    return this.cutsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: string) {
    return this.cutsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: string, @Body() dto: UpdateCutDto) {
    return this.cutsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: string) {
    return this.cutsService.remove(id);
  }
}
