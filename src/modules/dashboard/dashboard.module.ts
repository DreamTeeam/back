import { Module } from '@nestjs/common';
import { TenantTypeOrmModule } from '../../common/typeorm-tenant-repository/tenant-repository.provider';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Order } from '../orders/entities/order.entity';
import { Employee } from '../users/entities/employee.entity';
import { OrderDetail } from '../orders/entities/orderDetail.entity';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [
    TenantTypeOrmModule.forFeature([Order, Employee, OrderDetail, Product]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
