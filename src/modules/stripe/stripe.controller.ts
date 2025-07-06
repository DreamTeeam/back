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

@Controller('stripe')
export class StripeController {
  private readonly logger = new Logger(StripeController.name);

  constructor(
    private readonly stripeService: StripeService,
    // Remover las inyecciones directas aquí para evitar que se inicialicen
    // y accedan al TenantConnectionService antes de que el contexto esté listo.
    // private readonly subscriptionsService: SubscriptionsService,
    // private readonly ordersService: OrdersService,
    // private readonly companySubscriptionService: CompanySubscriptionService,
    private readonly tenantConnectionService: TenantConnectionService,
    private readonly moduleRef: ModuleRef, // Inyectar ModuleRef
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

    this.logger.debug(`Webhook recibido: Tipo = ${event.type}, ID = ${event.id}`);
    const customerId = await this.getCustomerIdFromStripeEvent(event);
    this.logger.debug(`CustomerId extraído del evento Stripe: ${customerId}`);

    if (!customerId) {
      this.logger.warn(
        `Webhook de tipo ${event.type} recibido sin customerId en los metadatos. No se puede procesar en el contexto de un tenant.`,
      );
      if (event.type === 'checkout.session.completed' && (event.data.object as Stripe.Checkout.Session).mode === 'payment') {
          throw new InternalServerErrorException('Cannot process payment webhook without a tenant ID. CustomerId missing in Stripe metadata.');
      }
      return { received: true, message: `No customerId found for event type ${event.type}, skipping tenant-specific processing.` };
    }

    try {
      this.logger.debug(`Intentando obtener DataSource para customerId: ${customerId}`);
      const tenantDataSource = await this.tenantConnectionService.getTenantDataSource(customerId);
      this.logger.debug(`DataSource obtenida/creada para customerId: ${customerId}`);

      await runInTenantContext(
        {
          customerId: customerId,
          tenantDataSource: tenantDataSource,
        },
        async () => {
          this.logger.debug(`Ejecutando lógica de webhook dentro del contexto del tenant: ${customerId}`);
          // --- ¡CAMBIO CRÍTICO AQUÍ: USAR RESOLVE() EN LUGAR DE GET() ! ---
          const ordersService = await this.moduleRef.resolve(OrdersService, undefined, { strict: false }); // 'undefined' para el contexto, ya que runInTenantContext lo maneja
          const companySubscriptionService = await this.moduleRef.resolve(CompanySubscriptionService, undefined, { strict: false }); // También cámbialos si son REQUEST scope
          const subscriptionsService = await this.moduleRef.resolve(SubscriptionsService, undefined, { strict: false }); // También cámbialos si son REQUEST scope
          // --- FIN DEL CAMBIO---


                    // ... (tus console.log de depuración para ordersService, ya puedes dejarlos o quitarlos)
          console.log('--- DEBUGGING OrdersService instance retrieved by ModuleRef.resolve() in StripeController ---');
          // console.log('Instance of ordersService (object itself):', ordersService);
          console.log('Logger property on ordersService (via any cast):', (ordersService as any).logger);
          console.log('Instance ID on ordersService:', (ordersService as any).instanceId);
          console.log('--- END DEBUGGING ModuleRef.resolve() ---');
          if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            if (session.mode === 'payment') {
              this.logger.log(`Webhook: Checkout de Pago Único completado para el tenant ${customerId}.`);
              await ordersService.createOrderFromStripeSession(session);
            }
          } else if (event.type === 'invoice.payment_succeeded' || event.type === 'invoice.payment_failed') {
              const contextType = await this.getEventContext(event);
              if (contextType === 'customer') {
                await companySubscriptionService.handleCompanyWebhook(event);
              } else if (contextType === 'client') {
                await subscriptionsService.handleClientWebhook(event);
              } else {
                this.logger.warn(
                  `Webhook de tipo ${event.type} recibido para el tenant ${customerId} sin un contexto de suscripción claro o relevante. No se puede procesar.`,
                );
              }
          }
          else if (event.type.startsWith('customer.subscription.')) {
              const contextType = await this.getEventContext(event);
              if (contextType === 'customer') {
                await companySubscriptionService.handleCompanyWebhook(event);
              } else if (contextType === 'client') {
                await subscriptionsService.handleClientWebhook(event);
              } else {
                this.logger.warn(
                  `Webhook de tipo ${event.type} recibido para el tenant ${customerId} sin un contexto de suscripción claro o relevante. No se puede procesar.`,
                );
              }
          }
          else {
            this.logger.debug(`Evento de Stripe no manejado después de establecer el contexto del tenant: ${event.type}`);
          }
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

  // --- FUNCIÓN getCustomerIdFromStripeEvent MODIFICADA (anteriormente) ---
  private async getCustomerIdFromStripeEvent(event: Stripe.Event): Promise<string | null> {
    let customerId: string | undefined;
    const dataObject = event.data.object as any;

    // Prioridad 1: metadata en checkout.session
    if (event.type === 'checkout.session.completed') {
      const session = dataObject as Stripe.Checkout.Session;
      customerId = session.metadata?.customerId;
      if (customerId) return customerId;
    }

    // Prioridad 2: metadata del objeto PaymentIntent si existe
    if (dataObject.object === 'payment_intent' && dataObject.id) {
      try {
        const paymentIntent = await this.stripeService.retrievePaymentIntent(dataObject.id);
        customerId = paymentIntent.metadata?.customerId;
        if (customerId) return customerId;
      } catch (error) {
        this.logger.warn(`Could not retrieve PaymentIntent ${dataObject.id} to get metadata: ${error.message}`);
      }
    }


    // Prioridad 3: Si hay un customer_id de Stripe en el objeto de datos del evento,
    // intenta recuperar los metadatos de ese customer de Stripe.
    const stripeCustomerIdFromEvent = dataObject.customer;
    if (stripeCustomerIdFromEvent && typeof stripeCustomerIdFromEvent === 'string') {
        try {
            const stripeCustomer = await this.stripeService.retrieveCustomer(stripeCustomerIdFromEvent);
            customerId = stripeCustomer.metadata?.customerId;
            if (customerId) return customerId;
        } catch (error) {
            this.logger.warn(`Could not retrieve Stripe Customer ${stripeCustomerIdFromEvent} for event type ${event.type}: ${error.message}`);
        }
    }

    // Prioridad 4: Si el objeto del evento es una suscripción o contiene una subscription_id
    // Intenta obtener el metadata del Customer asociado a la suscripción.
    const subscriptionId = dataObject.subscription || dataObject.id; // dataObject.id para subscription.created/updated/deleted
    if (dataObject.object === 'subscription' || (subscriptionId && typeof subscriptionId === 'string' && event.type.startsWith('customer.subscription.'))) {
      try {
        const subscription = await this.stripeService.retrieveSubscription(subscriptionId);
        if (subscription && typeof subscription.customer === 'string') {
          const subCustomer = await this.stripeService.retrieveCustomer(subscription.customer);
          customerId = subCustomer.metadata?.customerId;
          if (customerId) return customerId;
        }
      } catch (error) {
        this.logger.warn(`Could not retrieve Stripe Subscription ${subscriptionId} for event type ${event.type}: ${error.message}`);
      }
    }

    return customerId || null;
  }
  // --- FIN DE LA FUNCIÓN getCustomerIdFromStripeEvent MODIFICADA ---


  private async getEventContext(event: Stripe.Event): Promise<string | null> {
    if (event.type === 'checkout.session.completed') {
      return (event.data.object as Stripe.Checkout.Session).metadata?.context ?? null;
    }

    const subscriptionId = (event.data.object as any).subscription;
    if (subscriptionId && typeof subscriptionId === 'string') {
        const subscription = await this.stripeService.retrieveSubscription(subscriptionId);
        return subscription.metadata?.context ?? null;
    }
    if ((event.data.object as any).object === 'subscription') {
      return (event.data.object as Stripe.Subscription).metadata?.context ?? null;
    }
    return null;
  }
}