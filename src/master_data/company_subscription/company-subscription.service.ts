import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanySubscription } from './entities/company-subscription.entity';
import { CreateCompanySubscriptionDto } from './dto/create-company-subscription.dto';
import { UpdateCompanySubscriptionDto } from './dto/update-company-subscription.dto';
import Stripe from 'stripe';
import { StripeService } from 'src/modules/stripe/stripe.service';
import { CustomerService } from '../customer/customer.service';
import { GlobalMembershipType } from '../global_membership_type/entities/global-membership-type.entity';
import { CreateCustomerDto } from '../customer/dto/create-customer.dto';

@Injectable()
export class CompanySubscriptionService {
  private readonly logger = new Logger(CompanySubscriptionService.name);
  constructor(
    @InjectRepository(CompanySubscription, 'masterConnection') //! especificar la conexión
    private companySubscriptionRepository: Repository<CompanySubscription>,
    @InjectRepository(GlobalMembershipType, 'masterConnection')
    private globalMembershipTypeRepository: Repository<GlobalMembershipType>,
    private readonly stripeService: StripeService,
    private readonly customerService: CustomerService,
  ) {}

  async createCheckoutSessionForCustomer(dto: {
    email: string;
    price_id: string;
    name?: string;
  }) {
    const { email, price_id, name } = dto;
    const customerName = name || email;

    const stripeCustomer = await this.stripeService.findOrCreateCustomer(
      email,
      customerName,
    );

    const session = await this.stripeService.createSubscriptionCheckoutSession(
      stripeCustomer.id,
      price_id,
      'http://localhost:4000/subscripton_payment/success',
      'http://localhost:4000/subscripton_payment/cancelled',
      { context: 'customer' },
    );

    return { checkoutUrl: session.url };
  }

  async handleCompanyWebhook(event: Stripe.Event) {
    this.logger.debug(`[Company Webhook] Procesando evento: "${event.type}"`);
    switch (event.type) {
      case 'checkout.session.completed':
        await this._createFromWebhook(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case 'invoice.paid':
        await this._processPaidInvoice(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.updated':
        await this._processUpdatedSubscription(
          event.data.object as Stripe.Subscription,
        );
        break;
      case 'customer.subscription.deleted':
        await this._processCanceledSubscription(
          event.data.object as Stripe.Subscription,
        );
        break;
      case 'invoice.payment_failed':
        await this._processFailedPayment(event.data.object as Stripe.Invoice);
        break;
    }
  }

  async create(
    createDto: CreateCompanySubscriptionDto,
  ): Promise<CompanySubscription> {
    const newSubscription =
      this.companySubscriptionRepository.create(createDto);
    return this.companySubscriptionRepository.save(newSubscription);
  }

  findAll(): Promise<CompanySubscription[]> {
    return this.companySubscriptionRepository.find({
      relations: ['customer', 'membership_typeid'], //* corregido. PREGUNTAR:  aca la relation no deberia ser con globalMembershipType?
    });
  }

  async findOne(id: string): Promise<CompanySubscription> {
    const subscription = await this.companySubscriptionRepository.findOne({
      where: { id },
      relations: ['customer', 'membership_typeid'], //* corregido. PREGUNTAR:  aca la relation no deberia ser con globalMembershipType?
    });
    if (!subscription) {
      throw new NotFoundException(
        `Company Subscription with ID "${id}" not found`,
      );
    }
    return subscription;
  }

  //? este es el metodo que cree para buscar suscripciones de empresas por id de stripe
  async findOneByStripeId(
    stripeId: string,
  ): Promise<CompanySubscription | null> {
    return this.companySubscriptionRepository.findOne({
      where: { stripe_subscription_id: stripeId },
    });
  }

  async findActiveSubscriptionForCustomer(
    customerId: string,
  ): Promise<CompanySubscription | null> {
    return this.companySubscriptionRepository.findOne({
      where: { customer_id: customerId, status: 'active' },
      order: { end_date: 'DESC' },
      relations: ['membership_typeid'],
    });
  }

  async update(
    id: string,
    updateDto: UpdateCompanySubscriptionDto,
  ): Promise<CompanySubscription | null> {
    const subscription = await this.findOne(id);
    await this.companySubscriptionRepository.update(id, updateDto);
    return this.companySubscriptionRepository.findOne({
      where: { id },
      relations: ['customer', 'membershipType'],
    });
  }

  async remove(id: string): Promise<void> {
    const subscription = await this.findOne(id);
    await this.companySubscriptionRepository.softDelete(id);
  }

  // --- METODOS PRIVADOS PARA WEBHOOKS ---

  private async _createFromWebhook(session: Stripe.Checkout.Session) {
    const subscriptionId = session['subscription'] as string;
    const customerId = session.customer as string;

    if (await this.findOneByStripeId(subscriptionId)) {
      this.logger.warn(
        `La CompanySubscription para ${subscriptionId} ya existe.`,
      );
      return;
    }

    const invoice = (
      await this.stripeService.listInvoices({
        subscription: subscriptionId,
        limit: 1,
      })
    ).data[0];
    const stripeCustomer =
      await this.stripeService.retrieveCustomer(customerId);

    if (!stripeCustomer.email) {
      this.logger.error(
        `El cliente de Stripe ${customerId} no tiene email. Se aborta.`,
      );
      return;
    }

    let customer = await this.customerService.findOneByEmail(
      stripeCustomer.email,
    );
    if (!customer) {
      const createCustomerDto: CreateCustomerDto = {
        name: stripeCustomer.name || 'Nueva Empresa',
        email: stripeCustomer.email,
        slug: (stripeCustomer.name || 'empresa')
          .toLowerCase()
          .replace(/ /g, '-'),
        db_connection_string: 'TBD',
      };
      customer = await this.customerService.create(createCustomerDto);
    }

    const subscription =
      await this.stripeService.retrieveSubscription(subscriptionId);
    const globalMembershipType =
      await this.globalMembershipTypeRepository.findOne({
        where: { stripe_price_id: subscription.items.data[0].price.id },
      });

    if (!invoice || !globalMembershipType) {
      throw new Error(
        'Faltan datos maestros (GlobalMembershipType) para crear la CompanySubscription.',
      );
    }

    const createDto: CreateCompanySubscriptionDto = {
      customer_id: customer.id,
      membership_type_id: globalMembershipType.id,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      start_date: new Date(invoice.period_start * 1000),
      end_date: new Date(invoice.period_end * 1000),
      status: 'active',
      payment_status: 'paid',
    };
    await this.create(createDto);
    this.logger.log(
      `CompanySubscription creada para la empresa ${customer.name}.`,
    );
  }

  private async _processPaidInvoice(invoice: Stripe.Invoice) {
    const subscriptionId = invoice['subscription'] as string;
    const companySubscription = await this.findOneByStripeId(subscriptionId);
    if (companySubscription) {
      const updateDto: UpdateCompanySubscriptionDto = {
        end_date: new Date(invoice.period_end * 1000),
        payment_status: 'paid',
        status: 'active',
      };
      await this.update(companySubscription.id, updateDto);
      this.logger.log(
        `Suscripción de Empresa ${companySubscription.id} renovada.`,
      );
    }
  }

  private async _processCanceledSubscription(
    subscription: Stripe.Subscription,
  ) {
    const companySubscription = await this.findOneByStripeId(subscription.id);
    if (companySubscription) {
      const updateDto: UpdateCompanySubscriptionDto = { status: 'cancelled' };
      await this.update(companySubscription.id, updateDto);
      this.logger.log(
        `Suscripción de Empresa ${companySubscription.id} marcada como cancelada.`,
      );
    }
  }

  private async _processFailedPayment(invoice: Stripe.Invoice) {
    const subscriptionId = invoice['subscription'] as string;
    const companySubscription = await this.findOneByStripeId(subscriptionId);
    if (companySubscription) {
      const updateDto: UpdateCompanySubscriptionDto = {
        payment_status: 'unpaid',
        status: 'cancelled',
      };
      await this.update(companySubscription.id, updateDto);
      this.logger.log(
        `Suscripción de Empresa ${companySubscription.id} cancelada por pago fallido.`,
      );
    }
  }

  private async _processUpdatedSubscription(subscription: Stripe.Subscription) {
    const companySubscription = await this.findOneByStripeId(subscription.id);
    if (companySubscription) {
      const newPriceId = subscription.items.data[0].price.id;
      const newGlobalMembershipType =
        await this.globalMembershipTypeRepository.findOne({
          where: { stripe_price_id: newPriceId },
        });

      const updateDto: UpdateCompanySubscriptionDto = {
        end_date: new Date(subscription['current_period_end'] * 1000),
        membership_type_id: newGlobalMembershipType
          ? newGlobalMembershipType.id
          : companySubscription.membership_type_id,
      };
      await this.update(companySubscription.id, updateDto);
      this.logger.log(
        `Suscripción de Empresa ${companySubscription.id} actualizada al plan '${newGlobalMembershipType?.name}'.`,
      );
    }
  }
}
