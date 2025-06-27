import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AutoAudit } from '../auditModification/decorator/audit-log.decorator';
import { ProductSearchService } from './searchProducts.service';

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly productSearchService: ProductSearchService,
  ) {}

  @AutoAudit()
  @Post()
  create(@Body() createDto: CreateProductDto) {
    return this.productService.create(createDto);
  }

  @Get('search')
  async searchProducts(@Query('query') query: string, @Query('color') color?: string) {
    if (!query || query.trim() === '') {
      throw new BadRequestException('El parámetro "query" es obligatorio para la búsqueda.');
    }
    return this.productSearchService.searchProducts(query, color);
  }

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productService.delete(id);
  }

  // NACHO
  @Get('category/:categorySlug/subcategory/:subCategorySlug')
  getByCategoryAndSubcategory(
  @Param('categorySlug') categorySlug: string,
  @Param('subCategorySlug') subCategorySlug: string,
) {
  return this.productService.findByCategoryAndSubcategorySlugs(categorySlug, subCategorySlug);
}
}
