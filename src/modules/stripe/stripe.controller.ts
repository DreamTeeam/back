import {
  Controller,
  Post,
  Headers,
  Req,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Request } from 'express';
import Stripe from 'stripe';

import { StripeService } from './stripe.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service'; // Mantener el import para el tipo
import { OrdersService } from '../orders/orders.service'; // Mantener el import para el tipo
import { CompanySubscriptionService } from 'src/master_data/company_subscription/company-subscription.service'; // Mantener el import para el tipo
import { runInTenantContext } from '../../common/context/tenant-context';
import { TenantConnectionService } from '../../common/tenant-connection/tenant-connection.service';
import { CustomerService } from 'src/master_data/customer/customer.service';

@Controller('stripe')
export class StripeController {
  private readonly logger = new Logger(StripeController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly tenantConnectionService: TenantConnectionService,
    private readonly moduleRef: ModuleRef, // Inyectar ModuleRef
    private readonly customerService: CustomerService,
  ) {}

  @Post('webhook')
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: Request & { rawBody: Buffer },
  ) {
    let event: Stripe.Event;

    try {
      event = this.stripeService.constructEvent(request.rawBody, signature);
    } catch (err) {
      this.logger.error(`Webhook Error: ${err.message}`, err.stack);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    this.logger.debug(
      `Webhook recibido: Tipo = ${event.type}, ID = ${event.id}`,
    );
    const customerId = await this.getCustomerIdFromStripeEvent(event);
    this.logger.debug(`CustomerId extraído del evento Stripe: ${customerId}`);

    if (!customerId) {
      this.logger.warn(
        `Webhook de tipo ${event.type} recibido sin customerId en los metadatos. No se puede procesar en el contexto de un tenant.`,
      );
      // Podemos retornar temprano para eventos que sabemos que no son críticos si no tienen tenant
      return {
        received: true,
        message: `No customerId found for event type ${event.type}, skipping tenant-specific processing.`,
      };
    }

    try {
      this.logger.debug(
        `Intentando obtener DataSource para customerId: ${customerId}`,
      );
      const tenantDataSource =
        await this.tenantConnectionService.getTenantDataSource(customerId);
      this.logger.debug(
        `DataSource obtenida/creada para customerId: ${customerId}`,
      );

      await runInTenantContext(
        {
          customerId: customerId,
          tenantDataSource: tenantDataSource,
        },
        async () => {
          this.logger.debug(
            `Ejecutando lógica de webhook dentro del contexto del tenant: ${customerId}`,
          );
          // Resolvemos los servicios necesarios dentro del contexto del tenant
          const ordersService = await this.moduleRef.resolve(
            OrdersService,
            undefined,
            { strict: false },
          );
          const companySubscriptionService = await this.moduleRef.resolve(
            CompanySubscriptionService,
            undefined,
            { strict: false },
          );
          const subscriptionsService = await this.moduleRef.resolve(
            SubscriptionsService,
            undefined,
            { strict: false },
          );

          // =================================================================
          // =========== INICIO DE LA LÓGICA DE MANEJO DE EVENTOS CORREGIDA ==========
          // =================================================================

          if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;

            if (session.mode === 'payment') {
              this.logger.log(
                `[MODO PAGO] Checkout de Pago Único completado para el tenant ${customerId}.`,
              );
              await ordersService.createOrderFromStripeSession(session);
            } else if (session.mode === 'subscription') {
              this.logger.log(
                `[MODO SUSCRIPCIÓN] Checkout de Suscripción completado para el tenant ${customerId}.`,
              );
              const contextType = await this.getEventContext(event);
              if (contextType === 'customer') {
                await companySubscriptionService.handleCompanyWebhook(event);
              } else if (contextType === 'client') {
                await subscriptionsService.handleClientWebhook(event);
              }
            }
          } else if (
            event.type.startsWith('invoice.') ||
            event.type.startsWith('customer.subscription.')
          ) {
            // Este bloque maneja eventos de seguimiento como renovaciones, cancelaciones, pagos fallidos, etc.
            const contextType = await this.getEventContext(event);
            this.logger.debug(
              `Evento de seguimiento de suscripción [${event.type}] con contexto [${contextType}]`,
            );

            if (contextType === 'customer') {
              await companySubscriptionService.handleCompanyWebhook(event);
            } else if (contextType === 'client') {
              await subscriptionsService.handleClientWebhook(event);
            } else {
              this.logger.warn(
                `Webhook de tipo ${event.type} recibido para el tenant ${customerId} sin un contexto claro ('client' o 'customer').`,
              );
            }
          } else {
            this.logger.debug(
              `Evento de Stripe no manejado después de establecer el contexto del tenant: ${event.type}`,
            );
          }

          // =================================================================
          // ============ FIN DE LA LÓGICA DE MANEJO DE EVENTOS CORREGIDA ============
          // =================================================================
        },
      );
    } catch (error) {
      this.logger.error(
        `Error al procesar el webhook de Stripe para el tenant ${customerId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error processing Stripe webhook for tenant ${customerId}.`,
      );
    }

    return { received: true };
  }

  private async getCustomerIdFromStripeEvent(
    event: Stripe.Event,
  ): Promise<string | null> {
    let customerId: string | undefined;
    const dataObject = event.data.object as any;

    if (event.type === 'checkout.session.completed') {
      const session = dataObject as Stripe.Checkout.Session;
      customerId = session.metadata?.customerId;
      if (customerId) return customerId;
    }

    if (dataObject.object === 'payment_intent' && dataObject.id) {
      try {
        const paymentIntent = await this.stripeService.retrievePaymentIntent(
          dataObject.id,
        );
        customerId = paymentIntent.metadata?.customerId;
        if (customerId) return customerId;
      } catch (error) {
        this.logger.warn(
          `Could not retrieve PaymentIntent ${dataObject.id} to get metadata: ${error.message}`,
        );
      }
    }

    const stripeCustomerIdFromEvent = dataObject.customer;
    if (
      stripeCustomerIdFromEvent &&
      typeof stripeCustomerIdFromEvent === 'string'
    ) {
      try {
        const stripeCustomer = await this.stripeService.retrieveCustomer(
          stripeCustomerIdFromEvent,
        );
        customerId = stripeCustomer.metadata?.customerId;
        if (customerId) return customerId;
      } catch (error) {
        this.logger.warn(
          `Could not retrieve Stripe Customer ${stripeCustomerIdFromEvent} for event type ${event.type}: ${error.message}`,
        );
      }
    }

    const subscriptionId = dataObject.subscription || dataObject.id;
    if (
      dataObject.object === 'subscription' ||
      (subscriptionId &&
        typeof subscriptionId === 'string' &&
        event.type.startsWith('customer.subscription.'))
    ) {
      try {
        const subscription =
          await this.stripeService.retrieveSubscription(subscriptionId);
        if (subscription && typeof subscription.customer === 'string') {
          const subCustomer = await this.stripeService.retrieveCustomer(
            subscription.customer,
          );
          customerId = subCustomer.metadata?.customerId;
          if (customerId) return customerId;
        }
      } catch (error) {
        this.logger.warn(
          `Could not retrieve Stripe Subscription ${subscriptionId} for event type ${event.type}: ${error.message}`,
        );
      }
    }
    if (
      !customerId &&
      dataObject.customer &&
      typeof dataObject.customer === 'string'
    ) {
      try {
        const stripeCustomer = await this.stripeService.retrieveCustomer(
          dataObject.customer,
        );
        if (stripeCustomer.email) {
          this.logger.debug(
            `Buscando customer por email: ${stripeCustomer.email} en la DB maestra.`,
          );
          const customerInDb = await this.customerService.findOneByEmail(
            stripeCustomer.email,
          );
          if (customerInDb) {
            this.logger.debug(
              `Customer encontrado por email: ${customerInDb.id}`,
            );
            return customerInDb.id;
          }
        }
      } catch (error) {
        this.logger.warn(
          `No se pudo resolver el customerId a través del email del cliente de Stripe: ${error.message}`,
        );
      }
    }
    return customerId || null;
  }

  private async getEventContext(event: Stripe.Event): Promise<string | null> {
    if (event.type === 'checkout.session.completed') {
      return (
        (event.data.object as Stripe.Checkout.Session).metadata?.context ?? null
      );
    }

    const subscriptionId = (event.data.object as any).subscription;
    if (subscriptionId && typeof subscriptionId === 'string') {
      const subscription =
        await this.stripeService.retrieveSubscription(subscriptionId);
      return subscription.metadata?.context ?? null;
    }
    if ((event.data.object as any).object === 'subscription') {
      return (
        (event.data.object as Stripe.Subscription).metadata.context ?? null
      );
    }
    return null;
  }
}
