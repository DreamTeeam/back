import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditService } from './audit.service';
import { AutoAuditInterceptor } from './interceptor/audit-change.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

// Import your business entity services here
import { ProductService } from '../products/product.service';
import { CategoryService } from '../../catalogues/category/category.service';
import { ProductModule } from '../products/product.module';
import { CategoryModule } from 'src/catalogues/category/category.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),
    ProductModule,
    CategoryModule,
  ],
  providers: [
    AuditService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AutoAuditInterceptor,
    },
    {
      provide: 'ENTITY_SERVICES',
      useFactory: (
        productService: ProductService,
        categoryService: CategoryService,
      ) => ({
        productService,
        categoryService,
      }),
      inject: [ProductService, CategoryService],
    },
  ],
  exports: [AuditService],
})
export class AuditModule {}
