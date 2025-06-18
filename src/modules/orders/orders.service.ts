import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CreateOrderDto, ProductOrderDto } from './dto/create-order.dto';
import { StripeService } from '../stripe/stripe.service';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/orderDetail.entity';
import Stripe from 'stripe';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ProductService } from '../products/product.service';
import { Client } from '../users/entities/client.entity';
import { Employee } from '../users/entities/employee.entity';
import { ProductVariant } from '../productsVariant/entities/product-variant.entity';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource,
    private readonly stripeService: StripeService,
    private readonly productService: ProductService,
  ) {}

  async processNewOrder(dto: CreateOrderDto) {
    if (dto.payment_method === 'Efectivo') {
      return this.createCashOrder(dto);
    }

    if (dto.payment_method === 'Tarjeta') {
      return this.createCardPaymentSession(dto);
    }

    throw new BadRequestException('Tipo de pago no soportado.');
  }

  async createCashOrder(dto: CreateOrderDto): Promise<Order> {
    const variantIds = dto.products.map((p) => p.variant_id);
    const dbVariants =
      await this.productService.findManyVariantsByIds(variantIds);
    const variantMap = new Map(dbVariants.map((v) => [v.id, v]));
    const totalOrder = dto.products.reduce((sum, orderItem) => {
      const variant = variantMap.get(orderItem.variant_id);
      if (!variant)
        throw new NotFoundException(
          `Variante con ID ${orderItem.variant_id} no encontrada.`,
        );
      return sum + variant.product.sale_price * orderItem.quantity;
    }, 0);

    return this.dataSource.transaction((entityManager) =>
      this.buildOrderInTransaction(
        {
          employeeId: dto.employee_id,
          clientEmail: dto.email,
          orderProducts: dto.products,
          dbVariants,
          totalOrder,
        },
        entityManager,
      ),
    );
  }

  async createCardPaymentSession(dto: CreateOrderDto) {
    const variantIds = dto.products.map((p) => p.variant_id);
    const dbVariants =
      await this.productService.findManyVariantsByIds(variantIds);
    const variantMap = new Map(dbVariants.map((v) => [v.id, v]));

    const lineItems = dto.products.map((orderItem) => {
      const variant = variantMap.get(orderItem.variant_id);
      if (!variant)
        throw new NotFoundException(
          `Variante con ID ${orderItem.variant_id} no encontrada.`,
        );

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${variant.product.name} (${variant.description})`,
          },
          unit_amount: Math.round(variant.product.sale_price * 100),
        },
        quantity: orderItem.quantity,
      };
    });
    const metadata = {
      employeeId: dto.employee_id,
      clientEmail: dto.email || '',
      products: JSON.stringify(dto.products),
    };

    const stripeCustomer = await this.stripeService.findOrCreateCustomer(
      dto.email,
      'Cliente',
    );

    const session = await this.stripeService.createCheckoutSession(
      lineItems,
      metadata,
      'http://aca-va-la-pag.com/pago-exitoso',
      'http://la-pagina-again.com/pago-cancelado',
      stripeCustomer.id,
    );

    return { url: session.url };
  }

  async createOrderFromStripeSession(
    session: Stripe.Checkout.Session,
  ): Promise<Order> {
    this.logger.debug(`--- DENTRO DE CREATE ORDER FROM STRIPE SESSION ---`, {
      sessionId: session.id,
    });

    if (
      !session.metadata ||
      !session.metadata.employeeId ||
      !session.metadata.products ||
      session.amount_total === null
    ) {
      throw new BadRequestException(
        'Datos de sesión de Stripe incompletos o inválidos.',
      );
    }
    const {
      employeeId,
      clientEmail,
      products: productsJSON,
    } = session.metadata;

    const orderProducts: ProductOrderDto[] = JSON.parse(productsJSON);

    this.logger.debug(
      `Iniciando transacción para crear orden para empleado ${employeeId}.`,
    );

    const variantIds = orderProducts.map((p) => p.variant_id);
    const dbVariants =
      await this.productService.findManyVariantsByIds(variantIds);

    return this.dataSource.transaction((entityManager) =>
      this.buildOrderInTransaction(
        {
          employeeId,
          clientEmail,
          orderProducts,
          dbVariants,
          totalOrder: session.amount_total! / 100,
        },
        entityManager,
      ),
    );
  }

  async buildOrderInTransaction(
    data: {
      employeeId: string;
      clientEmail: string | null;
      orderProducts: ProductOrderDto[];
      dbVariants: ProductVariant[];
      totalOrder: number;
    },
    entityManager: EntityManager,
  ): Promise<Order> {
    const { employeeId, clientEmail, orderProducts, dbVariants, totalOrder } =
      data;

    const employee = await entityManager.findOneBy(Employee, {
      id: employeeId,
    });
    if (!employee)
      throw new NotFoundException(
        `Empleado con ID ${employeeId} no encontrado.`,
      );

    let client: Client | null = null;
    if (clientEmail) {
      client = await entityManager.findOne(Client, {
        where: { user: { email: clientEmail } },
        relations: ['user'],
      });
    }

    const variantMap = new Map(dbVariants.map((v) => [v.id, v]));

    for (const item of orderProducts) {
      const variant = variantMap.get(item.variant_id);
      if (!variant)
        throw new NotFoundException(
          `Variante con ID ${item.variant_id} no encontrada.`,
        );
      if (variant.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para ${variant.product.name} (${variant.description}). Stock: ${variant.stock}.`,
        );
      }

      await entityManager.decrement(
        ProductVariant,
        { id: variant.id },
        'stock',
        item.quantity,
      );
    }

    const order = new Order();
    order.employee = employee;
    order.client = client ?? null;
    order.total_order = totalOrder;
    order.total_products = orderProducts.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    order.date = new Date().toISOString().split('T')[0];
    order.time = new Date().toTimeString().split(' ')[0];

    order.details = orderProducts.map((item) => {
      const variant = variantMap.get(item.variant_id)!;
      return entityManager.create(OrderDetail, {
        variant,
        price: variant.product.sale_price,
        total_amount_of_products: item.quantity,
        subtotal_order: variant.product.sale_price * item.quantity,
      });
    });
    this.logger.log(` Orden creada exitosamente desde Stripe.`);

    return entityManager.save(order);
  }

  async findOneById(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: {
        employee: true,
        client: {
          user: true,
        },
        details: {
          variant: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: {
        employee: true,
        client: { user: true },
      },
      order: {
        date: 'DESC',
        time: 'DESC',
      },
    });
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.orderRepository.preload({
      id: id,
      ...updateOrderDto,
    });

    if (!order) {
      throw new NotFoundException(`Orden con ID ${id} no encontrada.`);
    }

    return this.orderRepository.save(order);
  }

  async delete(id: string): Promise<{ message: string }> {
    const order = await this.orderRepository.findOneBy({ id });
    if (!order) {
      throw new NotFoundException(`Orden con id ${id} no encontrada`);
    }
    await this.orderRepository.delete(id);
    return { message: `Orden  con id ${id} eliminado ` };
  }
}
