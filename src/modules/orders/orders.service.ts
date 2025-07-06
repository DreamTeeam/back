import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Scope,
  Logger, // <<-- Importar Logger
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { CreateOrderDto, ProductOrderDto } from './dto/create-order.dto';
import { StripeService } from '../stripe/stripe.service';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/orderDetail.entity';
import Stripe from 'stripe';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ProductService } from '../products/product.service';
import { Client } from '../users/entities/client.entity';
import { Employee } from '../users/entities/employee.entity';
import { ProductVariant } from '../productsVariant/entities/product-variant.entity';
import { CancellationService } from '../cancellation/cancellation.service';
import { CreateCancellationDto } from '../cancellation/dto/create-cancellation.dto';
import { VariantSize } from '../variantSIzes/entities/variantSizes.entity';
import { InjectTenantRepository } from '../../common/typeorm-tenant-repository/tenant-repository.decorator';
import { getTenantContext } from '../../common/context/tenant-context';

@Injectable() // <-- Añadir esto explícitamente
export class OrdersService {
  private readonly logger: Logger;
  private readonly instanceId: string;

  constructor(
    private readonly dataSource: DataSource,
    private readonly stripeService: StripeService,
    private readonly productService: ProductService,
    private readonly cancellationService: CancellationService,
  ) {
    this.logger = new Logger(OrdersService.name);
    this.instanceId = Math.random().toString(36).substring(2, 9); // <-- ASIGNAMOS UN ID ÚNICO

    // (Puedes dejar estos console.log temporales para confirmar)
    console.log('--- OrdersService Constructor EXECUTED ---');
    // console.log('Logger initialized in constructor:', !!this.logger);
    console.log(
      `DataSource in constructor (ID: ${this.instanceId}):`,
      !!this.dataSource,
    ); // <--- AÑADIR ESTO
  }

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
    // Obtener el customerId del contexto actual del tenant
    const tenantContext = getTenantContext();
    if (!tenantContext || !tenantContext.customerId) {
      this.logger.error(
        'No se pudo obtener el customerId del contexto del tenant para crear la sesión de Stripe.',
      );
      throw new BadRequestException(
        'Falta información del tenant para procesar el pago.',
      );
    }
    const currentTenantId = tenantContext.customerId;

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

    // AÑADE el customerId de tu sistema a los metadatos de Stripe
    const metadata = {
      employeeId: dto.employee_id,
      clientEmail: dto.email || '',
      products: JSON.stringify(dto.products),
      customerId: currentTenantId, // <-- AÑADIDO: ID del tenant para que Stripe lo devuelva en el webhook
    };

    const stripeCustomer = await this.stripeService.findOrCreateCustomer(
      dto.email,
      'Cliente',
      currentTenantId, // <-- PASAR currentTenantId al crear o buscar el cliente de Stripe
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
    console.log('--- DEBUGGING OrdersService.createOrderFromStripeSession ---');
    // console.log('Value of "this":', this);
    // console.log('Value of "this.logger":', this.logger);
    // console.log('Type of "this.logger":', typeof this.logger);
    console.log(
      `Instance ID in createOrderFromStripeSession: ${this.instanceId}`,
    ); // <-- AÑADIMOS ESTO
    // console.log(
    //   `DataSource in createOrderFromStripeSession: ${!!this.dataSource}`,
    // ); // <--- AÑADIR ESTO

    if (!this.logger) {
      console.error(
        'CRITICAL ERROR: this.logger is undefined right before use in createOrderFromStripeSession. (Should not happen now!)',
      );
      throw new Error(
        'Logger no inicializado. Problema con la inyección de dependencias.',
      );
    }

    this.logger.debug('🔥 LLEGAMOS a createOrderFromStripeSession');

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
    if (!employee) {
      throw new NotFoundException(
        `Empleado con ID ${employeeId} no encontrado.`,
      );
    }

    let client: Client | null = null;
    if (clientEmail) {
      client = await entityManager.findOne(Client, {
        where: { user: { email: clientEmail } },
        relations: ['user'],
      });
    }

    const variantMap = new Map(dbVariants.map((v) => [v.id, v]));

    const variantSizeRecords: VariantSize[] = [];

    for (const item of orderProducts) {
      const variant = variantMap.get(item.variant_id);
      if (!variant) {
        throw new NotFoundException(
          `Variante con ID ${item.variant_id} no encontrada.`,
        );
      }

      const variantSize = await entityManager.findOne(VariantSize, {
        where: {
          variantProduct: { id: item.variant_id },
          size: { id: item.size_id },
        },
        relations: ['variantProduct', 'size'],
      });

      if (!variantSize) {
        throw new NotFoundException(
          `No se encontró relación de talla para la variante ${variant.description}.`,
        );
      }

      if (variantSize.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para ${variant.product.name} (${variant.description}, talla ${variantSize.id}). Stock: ${variantSize.stock}.`,
        );
      }

      await entityManager.decrement(
        VariantSize,
        { id: variantSize.id },
        'stock',
        item.quantity,
      );

      variantSizeRecords.push(variantSize);
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

    order.details = orderProducts.map((item, index) => {
      const variant = variantMap.get(item.variant_id)!;
      const variantSize = variantSizeRecords[index];

      return entityManager.create(OrderDetail, {
        variant,
        variantSize: variantSize,
        price: variant.product.sale_price,
        total_amount_of_products: item.quantity,
        subtotal_order: variant.product.sale_price * item.quantity,
      });
    });

    this.logger.log(`Orden creada exitosamente desde Stripe.`);

    return entityManager.save(order);
  }

  async findOneById(id: string): Promise<Order> {
    const orderRepository = this.dataSource.manager.getRepository(Order);
    const order = await orderRepository.findOne({
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
    const orderRepository = this.dataSource.manager.getRepository(Order);
    return orderRepository.find({
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
    const orderRepository = this.dataSource.manager.getRepository(Order);
    const order = await orderRepository.preload({
      id: id,
      ...updateOrderDto,
    });

    if (!order) {
      throw new NotFoundException(`Orden con ID ${id} no encontrada.`);
    }

    return orderRepository.save(order);
  }

  async cancelOrder(
    orderId: string,
    employeeId: string,
    dto: CreateCancellationDto,
  ): Promise<Order> {
    return this.dataSource.transaction(async (entityManager) => {
      const order = await entityManager.findOne(Order, {
        where: { id: orderId },
        relations: ['details', 'details.variant', 'cancellation'],
      });

      if (!order) {
        throw new NotFoundException(`Orden con Id ${orderId} no encontrada.`);
      }

      if (order.cancellation) {
        throw new BadRequestException(
          `La orden con Id ${orderId} ya fue cancelada.`,
        );
      }

      for (const detail of order.details) {
        const variantSize = await entityManager.findOne(VariantSize, {
          where: {
            variantProduct: { id: detail.variant.id },
            // Necesitarías el size_id aquí si el stock es por talla
            // y orderDetail no lo guarda directamente.
            // Si orderDetail.variantSize es una relación, puedes usarlo:
            // size: { id: detail.variantSize.size.id }
          },
        });

        if (variantSize) {
          await entityManager.increment(
            VariantSize,
            { id: variantSize.id },
            'stock',
            detail.total_amount_of_products,
          );
        } else {
          this.logger.warn(
            `No se encontró VariantSize para la variante ${detail.variant.id} al intentar restituir stock.`,
          );
        }
      }

      const cancellation = await this.cancellationService.create(
        {
          order,
          employeeId: employeeId,
          reasonId: dto.cancellation_reason_id,
          comment: dto.comment,
        },
        entityManager,
      );

      order.cancellation = cancellation;

      this.logger.log(
        `Orden ${orderId} cancelada por empleado ${employeeId}. Stock restituido.`,
      );

      return entityManager.save(order);
    });
  }
}
