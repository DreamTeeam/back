import { Injectable } from '@nestjs/common';
import { InjectTenantRepository } from '../../common/typeorm-tenant-repository/tenant-repository.decorator';
import { IsNull, Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Employee } from '../users/entities/employee.entity';
import { OrderDetail } from '../orders/entities/orderDetail.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectTenantRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectTenantRepository(OrderDetail)
    private readonly orderDetailRepository: Repository<OrderDetail>,
  ) {}

  async getSalesByEmployee(startDate: string, endDate: string) {
    const queryBuilder = this.orderRepository.createQueryBuilder('order');

    const salesData = await queryBuilder
      .select('employee.id', 'employeeId')
      .innerJoin('order.employee', 'employee')
      .innerJoin('employee.user', 'user')
      .leftJoin('order.cancellation', 'cancellation')
      .addSelect('user.first_name', 'firstName')
      .addSelect('user.last_name', 'lastName')
      .addSelect('SUM(order.total_order)', 'totalSales')
      .addSelect('COUNT(order.id)', 'orderCount')
      .where('order.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('cancellation.id IS NULL')
      .groupBy('employee.id, user.first_name, user.last_name')

      .orderBy('"totalSales"', 'DESC')
      .getRawMany();

    return salesData.map((item) => ({
      ...item,
      totalSales: parseFloat(item.totalSales),
      orderCount: parseInt(item.orderCount, 10),
    }));
  }

  async getMonthlySales(year: number) {
    const salesData = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.cancellation', 'cancellation')
      .select('EXTRACT(MONTH FROM order.date)', 'month')
      .addSelect('SUM(order.total_order)', 'totalSales')
      .addSelect('COUNT(order.id)', 'orderCount')
      .where('EXTRACT(YEAR FROM order.date) = :year', { year })
      .andWhere('cancellation.id IS NULL')
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    return salesData.map((item) => ({
      month: parseInt(item.month, 10),
      totalSales: parseFloat(item.totalSales),
      orderCount: parseInt(item.orderCount, 10),
    }));
  }

  async getFinancialSummary(startDate: string, endDate: string) {
    const summary = await this.orderDetailRepository
      .createQueryBuilder('detail')
      .innerJoin('detail.order', 'order')
      .leftJoin('order.cancellation', 'cancellation')
      .innerJoin('detail.variant', 'variant')
      .innerJoin('variant.product', 'product')
      .select([
        'SUM(detail.subtotal_order) AS "totalRevenue"',
        'SUM(product.purchase_price * detail.total_amount_of_products) AS "totalCostOfGoodsSold"',
        'COUNT(DISTINCT order.id) AS "totalOrders"',
      ])
      .where('order.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('cancellation.id IS NULL')
      .getRawOne();

    const totalRevenue = parseFloat(summary.totalRevenue) || 0;
    const totalCostOfGoodsSold = parseFloat(summary.totalCostOfGoodsSold) || 0;

    return {
      startDate,
      endDate,
      totalRevenue, // total vendido al publico
      totalCostOfGoodsSold, // costo total de la empresa
      grossProfit: totalRevenue - totalCostOfGoodsSold, // ganancia neta
      totalOrders: parseInt(summary.totalOrders, 10) || 0,
    };
  }
}
