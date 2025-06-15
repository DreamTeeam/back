import { Controller, Get, Post, Body, Param, Delete, Put, ParseUUIDPipe } from '@nestjs/common';
import { ProductVariantService } from './product-variant.service';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

@Controller('product-variants')
export class ProductVariantController {
  constructor(private readonly productVariantService: ProductVariantService) {}

  @Post()
  create(@Body() createDto: CreateProductVariantDto) {
    return this.productVariantService.create(createDto);
  }

  @Get()
  findAll() {
    return this.productVariantService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productVariantService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() updateDto: UpdateProductVariantDto) {
    return this.productVariantService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productVariantService.delete(id);
  }
}
