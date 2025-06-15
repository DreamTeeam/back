import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { SubCategory } from '../subCategory/entities/sub-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Brand, SubCategory])],
  providers: [BrandService],
  controllers: [BrandController],
})
export class BrandModule {}
