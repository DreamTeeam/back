import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Size } from './entities/size-product.entity';
import { SizeService } from './size-product.service';
import { SizeController } from './size-product.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Size])],
  controllers: [SizeController],
  providers: [SizeService],
})
export class SizeModule {}
