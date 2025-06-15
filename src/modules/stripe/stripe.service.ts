import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!secretKey) {
      throw new Error(
        'La clave secreta de Stripe (STRIPE_SECRET_KEY) no está configurada.',
      );
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-05-28.basil',
    });
  }

  async findOrCreateCustomer(email: string, name: string) {
    const customers = await this.stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return customers.data[0];
    }
    return this.stripe.customers.create({ email, name });
  }
  async retrieveCustomer(id: string): Promise<Stripe.Customer> {
    return this.stripe.customers.retrieve(id) as Promise<Stripe.Customer>;
  }

  async createCheckoutSession(
    lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
    metadata: Stripe.MetadataParam,
    successUrl: string,
    cancelUrl: string,
    customerId: string,
  ) {
    return this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      metadata: metadata,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer: customerId,
    });
  }

  async createSubscription(customerId: string, priceId: string) {
    return this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent'],
    });
  }

  constructEvent(body: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!webhookSecret) {
      this.logger.error(
        'El secreto del webhook de Stripe (STRIPE_WEBHOOK_SECRET) no está configurado.',
      );
      throw new Error(
        'La configuración del servidor está incompleta: falta el secreto del webhook de Stripe.',
      );
    }
    return this.stripe.webhooks.constructEvent(body, signature, webhookSecret);
  }

  async createSubscriptionCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
  }

  async cancelSubscription(id: string): Promise<Stripe.Subscription> {
    this.logger.log(`Cancelando suscripción de Stripe: ${id}`);
    return this.stripe.subscriptions.cancel(id);
  }

  async retrieveSubscription(id: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.retrieve(id);
  }

  async listInvoices(
    params: Stripe.InvoiceListParams,
  ): Promise<Stripe.ApiList<Stripe.Invoice>> {
    return this.stripe.invoices.list(params);
  }
}
