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
  Res,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AutoAudit } from '../auditModification/decorator/audit-log.decorator';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { ProductsCsvService } from './csv/product-csv.service';
import { Response } from 'express';import { ProductSearchService } from './searchProducts.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Employee } from '../users/entities/employee.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('products')
export class ProductController {
  constructor(
    
    private readonly productService: ProductService,
    private readonly csvService: ProductsCsvService,
    private readonly productSearchService: ProductSearchService,
  ) {}

  @AutoAudit()
  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() createDto: CreateProductDto, @GetUser() user: { userId: string }) {
    console.log('Empleado extraído del token:', user.userId);
    return this.productService.create(createDto, user.userId);
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
    return this.productService.findByCategoryAndSubcategorySlugs(
      categorySlug,
      subCategorySlug,
    );
  }

  @Get('csv/download-prices')
  async downloadPricesCsv(@Res() res: Response) {
    const filePath = await this.csvService.exportPricesToCsv();
    res.download(filePath, 'productos-precios.csv');
  }

  @Post('csv/update-prices')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './temp',
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  async updatePricesCsv(@UploadedFile() file: Express.Multer.File) {
    return this.csvService.loadCsvToUpdatePrices(file);
  }
}