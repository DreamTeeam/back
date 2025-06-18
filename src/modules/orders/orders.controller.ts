import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  BadRequestException,
  Logger,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Delete,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { StripeService } from '../stripe/stripe.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import Stripe from 'stripe';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly stripeService: StripeService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Post()
  createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.processNewOrder(createOrderDto);
  }

  @Post('stripe-webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: Request & { rawBody: Buffer },
  ) {
    let event: Stripe.Event;

    try {
      event = this.stripeService.constructEvent(request.rawBody, signature);
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription') {
          this.logger.log(`Checkout de Suscripción completado.`);
          await this.subscriptionsService.handleSubscriptionWebhook(event);
        } else if (session.mode === 'payment') {
          this.logger.log(`Checkout de Pago Único completado.`);
          await this.ordersService.createOrderFromStripeSession(session);
        }
        break;
      }

      case 'invoice.paid':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'invoice.payment_failed': {
        this.logger.log(
          `Evento de ciclo de vida de suscripción recibido: ${event.type}. `,
        );
        await this.subscriptionsService.handleSubscriptionWebhook(event);
        break;
      }

      default: {
        this.logger.warn(`Evento de webhook no manejado: ${event.type}`);
      }
    }

    return { received: true };
  }

  @Get(':id')
  findOrderById(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOneById(id);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Put(':id')
  updateOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.delete(id);
  }
}
