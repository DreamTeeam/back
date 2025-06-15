import { Controller, Post, Body, Get, Param, Put, Headers, ParseIntPipe, Delete } from '@nestjs/common';
import { CutService } from './cut.service';
import { CreateCutDto } from './create-cutDto';
import { UpdateCutDto } from './update-cutDto';

@Controller('cuts')
export class CutController {
  constructor(private readonly cutService: CutService) {}

  @Post()
  create(@Body() createCutDto: CreateCutDto, @Headers('authorization') token: string) {
    return this.cutService.create(createCutDto, token);
  }

  @Get()
  findAll() {
    return this.cutService.findAll();
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateCutDto: UpdateCutDto) {
    return this.cutService.update(+id, updateCutDto);
  }

  @Delete(':id')
remove(@Param('id', ParseIntPipe) id: number) {
  return this.cutService.remove(id);
}

}
