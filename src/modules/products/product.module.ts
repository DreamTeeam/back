import { Module } from '@nestjs/common';
import { ProductService } from '../products/product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Category } from 'src/catalogues/category/entities/category.entity';
import { SubCategory } from 'src/catalogues/subCategory/entities/sub-category.entity';
import { Brand } from 'src/catalogues/brand/entities/brand.entity';
import { ProductVariant } from '../productsVariant/entities/product-variant.entity';
import { VariantSize } from '../variantSIzes/entities/variantSizes.entity';
import { Color } from 'src/catalogues/colorProduct/entities/colorProduct.entity';
import { ProductVariantModule } from '../productsVariant/product-variant.module';
import { TenantTypeOrmModule } from 'src/common/typeorm-tenant-repository/tenant-repository.provider';
import { ProductsCsvService } from './csv/product-csv.service';
import { ProductSearchService } from './searchProducts.service';

@Module({
  imports: [TenantTypeOrmModule.forFeature([Product, Category, SubCategory, Brand, Color, ProductVariant, VariantSize]),
ProductVariantModule
],
  providers: [ProductService, ProductSearchService, ProductsCsvService],
  controllers: [ProductController],
  exports: [ProductService]
})
export class ProductModule {}
