import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StripeService } from '../stripe/stripe.service';
import { Membership } from './membership/entities/membership.entity';
import { MembershipType } from './membershipTypes/entities/membershipType.entity';
import Stripe from 'stripe';
import { CompanyMembership } from './membershipTypes/entities/companyMembership.entity';
import { User } from '../users/entities/user.entity';
import { Client } from '../users/entities/client.entity';
import { Employee } from '../users/entities/employee.entity';
import { MembershipStatus } from 'src/catalogues/MembershipStatus/entities/membership-status.entity';
import { CreateSubscriptionDto } from './create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly stripeService: StripeService,
  ) {}

  async createSubscriptionCheckout(dto: CreateSubscriptionDto) {
    const { email, price_id, first_name, last_name } = dto;
    const customerName =
      first_name && last_name ? `${first_name} ${last_name}` : email;

    const stripeCustomer = await this.stripeService.findOrCreateCustomer(
      email,
      customerName,
    );

    const successUrl = 'http://AcaPonerPagina/pago-exitoso';
    const cancelUrl = 'http://AcaPonerPagina/pago-cancelado';

    const checkoutSession =
      await this.stripeService.createSubscriptionCheckoutSession(
        stripeCustomer.id,
        price_id,
        successUrl,
        cancelUrl,
      );

    return { checkoutUrl: checkoutSession.url };
  }

  async isMembershipActive(userId: string): Promise<boolean> {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { id: userId },
      relations: ['client', 'employee'],
    });

    if (!user) return false;

    let membership: Membership | null = null;

    if (user.client) {
      membership = await this.dataSource.getRepository(Membership).findOne({
        where: { client: { id: user.client.id } },
        relations: ['status'],
        order: { updated_at: 'DESC' },
      });
    } else if (user.employee) {
      membership = await this.dataSource.getRepository(Membership).findOne({
        where: { company_membership: { employee: { id: user.employee.id } } },
        relations: ['status'],
        order: { updated_at: 'DESC' },
      });
    }

    if (!membership || !membership.status) {
      return false;
    }

    const statusIsActive = membership.status.isActive;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expirationDate = new Date(membership.expiration_date);
    const isDateValid = expirationDate >= today;

    return statusIsActive && isDateValid;
  }

  async handleSubscriptionWebhook(event: Stripe.Event) {
    this.logger.debug(`[Webhook Handler] Procesando evento: "${event.type}"`);
    switch (event.type) {
      case 'checkout.session.completed':
        await this.processCheckoutSession(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case 'invoice.paid':
        await this.processPaidInvoice(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.updated':
        await this.processUpdatedSubscription(
          event.data.object as Stripe.Subscription,
        );
        break;
      case 'customer.subscription.deleted':
        await this.processCanceledSubscription(
          event.data.object as Stripe.Subscription,
        );
        break;
      case 'invoice.payment_failed':
        await this.processFailedPayment(event.data.object as Stripe.Invoice);
        break;
      default:
        this.logger.log(` Evento '${event.type}' no requiere acción.`);
    }
  }

  private async processCheckoutSession(session: Stripe.Checkout.Session) {
    if (session.mode !== 'subscription' || !session.subscription) {
      return;
    }

    const subscriptionId = session.subscription as string;
    this.logger.log(`Checkout completado.`);

    const existingMembership = await this.dataSource.manager.findOneBy(
      Membership,
      { stripe_subscription_id: subscriptionId },
    );
    if (existingMembership) {
      this.logger.warn(`La membresía para ${subscriptionId} ya existe.`);
      return;
    }

    try {
      const customerId = session.customer as string;

      const invoices = await this.stripeService.listInvoices({
        subscription: subscriptionId,
        limit: 1,
      });

      if (invoices.data.length === 0) {
        throw new Error(
          `No se encontró la factura inicial para la suscripción ${subscriptionId}`,
        );
      }
      const invoice = invoices.data[0];
      this.logger.debug(
        `Factura inicial ${invoice.id} encontrada para la suscripción.`,
      );

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
        { membershipStatus: 'active' },
      );

      if (!membershipType || !activeStatus || !user) {
        throw new Error('Faltan datos maestros para crear la membresía.');
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

      if (membershipType.name.toLowerCase().includes('client')) {
        let client = user.client;
        if (!client) {
          client = this.dataSource.manager.create(Client, { user });
          await this.dataSource.manager.save(client);
        }
        newMembership.client = client;
      } else if (membershipType.name.toLowerCase().includes('company')) {
        let employee = user.employee;
        if (!employee) {
          employee = this.dataSource.manager.create(Employee, { user });
          await this.dataSource.manager.save(employee);
        }
        const companyMembership = this.dataSource.manager.create(
          CompanyMembership,
          { employee },
        );
        await this.dataSource.manager.save(companyMembership);
        newMembership.company_membership = companyMembership;
      }

      await this.dataSource.manager.save(newMembership);
      this.logger.log(
        ` Membresía ${newMembership.id} creada desde checkout session.`,
      );
    } catch (error) {
      this.logger.error(
        `Error en processCheckoutSession: ${error.message}`,
        error.stack,
      );
    }
  }

  private async processPaidInvoice(invoice: Stripe.Invoice) {
    const subscriptionId = invoice['subscription'] as string;
    if (!subscriptionId) return;

    const membership = await this.dataSource.manager.findOneBy(Membership, {
      stripe_subscription_id: subscriptionId,
    });
    if (!membership) {
      this.logger.log(`Se recibió 'invoice.paid' para ${subscriptionId}`);
      return;
    }

    this.logger.log(`Renovando membresía ${membership.id}`);
    membership.expiration_date = new Date(invoice.period_end * 1000)
      .toISOString()
      .split('T')[0];
    const activeStatus = await this.dataSource.manager.findOneBy(
      MembershipStatus,
      { membershipStatus: 'active' },
    );
    if (activeStatus) membership.status = activeStatus;
    await this.dataSource.manager.save(membership);
    this.logger.log(`Membresía ${membership.id} renovada.`);
  }

  private async processUpdatedSubscription(subscription: Stripe.Subscription) {
    const membership = await this.dataSource.manager.findOneBy(Membership, {
      stripe_subscription_id: subscription.id,
    });
    if (!membership) return;

    const newPriceId = subscription.items.data[0].price.id;
    const newMembershipType = await this.dataSource.manager.findOneBy(
      MembershipType,
      { stripe_price_id: newPriceId },
    );

    membership.type = newMembershipType!;
    membership.expiration_date = new Date(
      subscription['current_period_end'] * 1000,
    )
      .toISOString()
      .split('T')[0];

    await this.dataSource.manager.save(membership);
    this.logger.log(
      `Membresía ${membership.id} actualizada al plan '${newMembershipType!.name}'.`,
    );
  }

  private async processCanceledSubscription(subscription: Stripe.Subscription) {
    const membership = await this.dataSource.manager.findOneBy(Membership, {
      stripe_subscription_id: subscription.id,
    });
    if (!membership) return;

    const canceledStatus = await this.dataSource.manager.findOneBy(
      MembershipStatus,
      { membershipStatus: 'cancelled' },
    );
    if (!canceledStatus)
      throw new InternalServerErrorException(
        "Estado 'cancelled' no encontrado.",
      );

    membership.status = canceledStatus;
    await this.dataSource.manager.save(membership);
    this.logger.log(`Membresía ${membership.id} marcada como cancelada.`);
  }

  private async processFailedPayment(invoice: Stripe.Invoice) {
    const subscriptionId = invoice['subscription'] as string;
    if (!subscriptionId) return;

    const membership = await this.dataSource.manager.findOneBy(Membership, {
      stripe_subscription_id: subscriptionId,
    });
    if (!membership) return;
  }

  private async findOrCreateUserByEmail(
    stripeCustomer: Stripe.Customer,
  ): Promise<User> {
    const email = stripeCustomer.email!;
    let user = await this.dataSource.manager.findOne(User, {
      where: { email },
      relations: ['client', 'employee'],
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
