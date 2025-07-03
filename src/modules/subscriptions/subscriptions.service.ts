import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StripeService } from '../stripe/stripe.service';
import { Membership } from './membership/entities/membership.entity';
import { MembershipType } from './membershipTypes/entities/membershipType.entity';
import Stripe from 'stripe';
import { User } from '../users/entities/user.entity';
import { Client } from '../users/entities/client.entity';
import { MembershipStatus } from 'src/catalogues/MembershipStatus/entities/membership-status.entity';
import { CreateSubscriptionDto } from './create-subscription.dto';
import { getTenantContext } from 'src/common/context/tenant-context';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly stripeService: StripeService,
  ) {}

  async createSubscriptionCheckout(dto: CreateSubscriptionDto) {
    // --- LÓGICA NUEVA PARA OBTENER EL TENANT ID ---
    const tenantContext = getTenantContext();
    if (!tenantContext || !tenantContext.customerId) {
      this.logger.error(
        'No se pudo obtener el customerId del contexto del tenant para crear la sesión de Stripe.',
      );
      throw new BadRequestException(
        'Falta información del tenant para procesar la suscripción.',
      );
    }
    const currentTenantId = tenantContext.customerId;
    // --- FIN DE LA LÓGICA NUEVA ---

    const { email, price_id, first_name, last_name } = dto;
    const customerName =
      first_name && last_name ? `${first_name} ${last_name}` : email;

    const stripeCustomer = await this.stripeService.findOrCreateCustomer(
      email,
      customerName,
    );

    const successUrl = 'https://nivoapp.vercel.app/subscripton_payment/success';
    const cancelUrl = 'https://nivoapp.vercel.app/subscripton_payment/cancelled';

    const checkoutSession =
      await this.stripeService.createSubscriptionCheckoutSession(
        stripeCustomer.id,
        price_id,
        successUrl,
        cancelUrl,
        {
          context: dto.context,
          customerId: currentTenantId,
        },
      );

    return { checkoutUrl: checkoutSession.url };
  }

  async isClientMembershipActive(userId: string): Promise<boolean> {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { id: userId },
      relations: ['client'],
    });

    if (!user || !user.client) {
      return false;
    }

    const membership = await this.dataSource.getRepository(Membership).findOne({
      where: {
        client: { id: user.client.id },
        status: { membership_status: 'active' },
      },
      order: { expiration_date: 'DESC' },
    });

    if (!membership) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(membership.expiration_date) >= today;
  }

  async handleClientWebhook(event: Stripe.Event) {
    this.logger.debug(`[Client Webhook] Procesando evento: "${event.type}"`);
    switch (event.type) {
      case 'checkout.session.completed':
        await this.createClientMembershipFromWebhook(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case 'invoice.paid':
        await this.processClientPaidInvoice(
          event.data.object as Stripe.Invoice,
        );
        break;
      case 'customer.subscription.updated':
        await this.processClientUpdatedSubscription(
          event.data.object as Stripe.Subscription,
        );
        break;
      case 'customer.subscription.deleted':
        await this.processClientCanceledSubscription(
          event.data.object as Stripe.Subscription,
        );
        break;
      case 'invoice.payment_failed':
        await this.processClientFailedPayment(
          event.data.object as Stripe.Invoice,
        );
        break;
      default:
        this.logger.log(
          ` Evento '${event.type}' no requiere acción para el cliente.`,
        );
    }
  }

  // --- METODOS PRIVADOS: LOGICA PARA CLIENTES FINALES ---

  private async createClientMembershipFromWebhook(
    session: Stripe.Checkout.Session,
  ) {
    const subscriptionId = session.subscription as string;
    const customerId = session.customer as string;

    const existingMembership = await this.dataSource.manager.findOneBy(
      Membership,
      {
        stripe_subscription_id: subscriptionId,
      },
    );
    if (existingMembership) {
      this.logger.warn(`La membresía para ${subscriptionId} ya existe.`);
      return;
    }

    try {
      const invoice = (
        await this.stripeService.listInvoices({
          subscription: subscriptionId,
          limit: 1,
        })
      ).data[0];
      const stripeCustomer =
        await this.stripeService.retrieveCustomer(customerId);
      const user = await this.findOrCreateUserByEmail(stripeCustomer);
      const subscription =
        await this.stripeService.retrieveSubscription(subscriptionId);
      const membershipType = await this.dataSource.manager.findOneBy(
        MembershipType,
        { stripe_price_id: subscription.items.data[0].price.id },
      );
      const activeStatus = await this.dataSource.manager.findOneBy(
        MembershipStatus,
        { membership_status: 'active' },
      );

      if (!invoice || !membershipType || !activeStatus || !user) {
        throw new Error(
          'Faltan datos maestros del inquilino para crear la membresía.',
        );
      }

      const newMembership = this.dataSource.manager.create(Membership, {
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        type: membershipType,
        status: activeStatus,
        creation_date: new Date(invoice.period_start * 1000)
          .toISOString()
          .split('T')[0],
        expiration_date: new Date(invoice.period_end * 1000)
          .toISOString()
          .split('T')[0],
      });

      let client = user.client;
      if (!client) {
        client = this.dataSource.manager.create(Client, { user });
        await this.dataSource.manager.save(client);
      }
      newMembership.client = client;

      await this.dataSource.manager.save(newMembership);
      this.logger.log(
        `Membresía de Cliente Final ${newMembership.id} creada para ${user.email}.`,
      );
    } catch (error) {
      this.logger.error(
        `Error en createClientMembershipFromWebhook: ${error.message}`,
        error.stack,
      );
    }
  }

  private async processClientPaidInvoice(invoice: Stripe.Invoice) {
    const subscriptionId = invoice['subscription'] as string;
    if (!subscriptionId) return;

    const membership = await this.dataSource.manager.findOneBy(Membership, {
      stripe_subscription_id: subscriptionId,
    });
    if (membership) {
      membership.expiration_date = new Date(invoice.period_end * 1000)
        .toISOString()
        .split('T')[0];
      const activeStatus = await this.dataSource.manager.findOneBy(
        MembershipStatus,
        { membership_status: 'active' },
      );
      if (activeStatus) membership.status = activeStatus;
      await this.dataSource.manager.save(membership);
      this.logger.log(`Membresía de Cliente Final ${membership.id} renovada.`);
    }
  }

  private async processClientUpdatedSubscription(
    subscription: Stripe.Subscription,
  ) {
    const membership = await this.dataSource.manager.findOneBy(Membership, {
      stripe_subscription_id: subscription.id,
    });
    if (membership) {
      const newPriceId = subscription.items.data[0].price.id;
      const newMembershipType = await this.dataSource.manager.findOneBy(
        MembershipType,
        { stripe_price_id: newPriceId },
      );
      if (newMembershipType) {
        membership.type = newMembershipType;
      }
      membership.expiration_date = new Date(
        subscription['current_period_end'] * 1000,
      )
        .toISOString()
        .split('T')[0];
      await this.dataSource.manager.save(membership);
      this.logger.log(
        `Membresía de Cliente Final ${membership.id} actualizada al plan '${newMembershipType?.name}'.`,
      );
    }
  }

  private async processClientCanceledSubscription(
    subscription: Stripe.Subscription,
  ) {
    const membership = await this.dataSource.manager.findOneBy(Membership, {
      stripe_subscription_id: subscription.id,
    });
    if (membership) {
      const canceledStatus = await this.dataSource.manager.findOneBy(
        MembershipStatus,
        { membership_status: 'cancelled' },
      );
      if (canceledStatus) {
        membership.status = canceledStatus;
        await this.dataSource.manager.save(membership);
        this.logger.log(
          `Membresía de Cliente Final ${membership.id} marcada como cancelada.`,
        );
      }
    }
  }

  private async processClientFailedPayment(invoice: Stripe.Invoice) {
    const subscriptionId = invoice['subscription'] as string;
    if (!subscriptionId) return;

    const membership = await this.dataSource.manager.findOneBy(Membership, {
      stripe_subscription_id: subscriptionId,
    });
    if (membership) {
      const canceledStatus = await this.dataSource.manager.findOneBy(
        MembershipStatus,
        { membership_status: 'cancelled' },
      );
      if (canceledStatus) {
        membership.status = canceledStatus;
        await this.dataSource.manager.save(membership);
        this.logger.log(
          `Membresía de Cliente Final ${membership.id} marcada como 'cancelled' por pago fallido.`,
        );
      }
    }
  }

  private async findOrCreateUserByEmail(
    stripeCustomer: Stripe.Customer,
  ): Promise<User> {
    const email = stripeCustomer.email!;
    let user = await this.dataSource.manager.findOne(User, {
      where: { email },
      relations: ['client'],
    });

    if (user) return user;

    return this.dataSource.transaction(async (em) => {
      const nameParts = stripeCustomer.name?.split(' ') || [];
      const newUser = em.create(User, {
        email: email,
        first_name: nameParts.shift() || 'Usuario',
        last_name: nameParts.join(' ') || 'Stripe',
        password: 'RandomPassword',
      });
      return em.save(newUser);
    });
  }
}
