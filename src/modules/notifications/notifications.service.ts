import { Injectable, Logger } from '@nestjs/common';
import { InjectTenantRepository } from 'src/common/typeorm-tenant-repository/tenant-repository.decorator';
import { Repository, EntityManager } from 'typeorm';

import { Notification } from './entities/notification.entity';
import { MailerService } from './mailer/mailer.service';
import { NotificationType } from './types/notification-type.enum';

import { Client } from 'src/modules/users/entities/client.entity';
import { Employee } from 'src/modules/users/entities/employee.entity';
import { Customer } from 'src/master_data/customer/entities/customer.entity';
import { VariantSize } from '../variantSIzes/entities/variantSizes.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectTenantRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly mailerService: MailerService,
  ) {}

  async sendNotification(options: {
    type: NotificationType;
    title: string;
    message: string;
    client?: Client;
    employee?: Employee;
    customer?: Customer;
    sendEmail?: boolean;
    emailTemplate?: string;
    emailContext?: Record<string, any>;
    manager?: EntityManager;
  }) {
    const repo = options.manager
      ? options.manager.getRepository(Notification)
      : this.notificationRepository;

    const notification = repo.create({
      type: options.type,
      title: options.title,
      message: options.message,
      client: options.client,
      employee: options.employee,
      customer: options.customer,
      sent_by_email: !!options.sendEmail,
    });

    await repo.save(notification);

    this.logger.debug('Destinatario de email', {
      client: options.client?.user?.email,
      employee: options.employee?.user?.email,
      customer: options.customer?.email,
    });
    if (options.sendEmail && options.emailTemplate) {
      const to =
        options.client?.user?.email ||
        options.employee?.user?.email ||
        options.customer?.email;

      const name =
        options.client?.user?.first_name ||
        options.employee?.user?.first_name ||
        options.customer?.name ||
        'Usuario';

      if (to) {
        await this.mailerService.sendMail(
          to,
          options.title,
          options.emailTemplate,
          {
            ...options.emailContext,
            name,
          },
        );
      } else {
        console.warn('No se pudo enviar email: destinatario no definido');
      }
    }

    return notification;
  }

  async notifyLogin(
    employeeOrClient: Employee | Client,
    type: 'employee' | 'client',
  ) {
    const email = employeeOrClient?.user?.email;
    const name = employeeOrClient?.user?.first_name || 'Usuario';

    const loginTime = new Date().toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    const common = {
      type: NotificationType.LOGIN_SUCESS,
      title: 'Inicio de sesión detectado',
      message: `Hola ${name}, has iniciado sesión el ${loginTime}`,
      sendEmail: true,
      emailContext: { loginTime },
    };

    if (type === 'employee') {
      return this.sendNotification({
        ...common,
        employee: employeeOrClient as Employee,
        emailTemplate: 'login-employee',
      });
    } else {
      return this.sendNotification({
        ...common,
        client: employeeOrClient as Client,
        emailTemplate: 'login-client',
      });
    }
  }

  async notifyWelcome(
    user: Employee | Client,
    type: 'employee' | 'client',
    manager?: EntityManager,
    credentials?: { email: string; password: string },
  ) {
    const email = user?.user?.email;
    const name = `${user?.user?.first_name} ${user?.user?.last_name}`;

    const common = {
      type: NotificationType.WELCOME,
      sendEmail: true,
      emailContext: {
        name,
        email: credentials?.email,
        password: credentials?.password,
      },
      manager,
    };

    if (type === 'employee') {
      return this.sendNotification({
        ...common,
        title: '¡Bienvenido a Nivo!',
        message: `Hola ${name}, bienvenido al equipo.`,
        employee: user as Employee,
        emailTemplate: 'welcome-employee',
      });
    } else {
      return this.sendNotification({
        ...common,
        title: '¡Bienvenido a nuestra tienda!',
        message: `Hola ${name}, gracias por registrarte.`,
        client: user as Client,
        emailTemplate: 'welcome-client',
      });
    }
  }

  async notifyIfLowStock(variantSize: VariantSize) {
    if (variantSize.stock >= 5) return;

    const product = variantSize.variantProduct?.product;
    const employee = product?.employee;

    if (!product || !employee?.user?.email) return;

    const admins = await this.getAdmins();

    for (const admin of admins) {
      await this.sendNotification({
        type: NotificationType.PRODUCT_LOW_STOCK,
        title: 'Producto con stock bajo',
        message: `El producto "${product.name}" tiene poco stock.`,
        employee: admin,
        sendEmail: true,
        emailTemplate: 'stock-low-single',
        emailContext: {
          productName: product.name,
          stockLeft: variantSize.stock,
          productUrl: `https://nivo.com/products/${product.slug}`,
          productImage: variantSize.variantProduct.image?.[0] || '',
        },
      });
    }
  }

  async notifyLowStockMultiple(variants: VariantSize[]) {
    if (variants.length === 0) return;

    const admins = await this.getAdmins();

    for (const admin of admins) {
      await this.sendNotification({
        type: NotificationType.PRODUCT_LOW_STOCK,
        title: 'Productos con stock bajo',
        message: `Tienes ${variants.length} productos con stock bajo.`,
        employee: admin,
        sendEmail: true,
        emailTemplate: 'stock-low-multiple',
        emailContext: {
          products: variants.map((v) => ({
            name: v.variantProduct.product.name,
            stock: v.stock,
          })),
        },
      });
    }
  }

  public async getAdmins(): Promise<Employee[]> {
    const repo = this.notificationRepository.manager.getRepository(Employee);

    const employees = await repo.find({
      relations: ['roles', 'user'],
    });

    return employees.filter((emp) =>
      emp.roles.some((role) => role.name?.toLowerCase() === 'admin'),
    );
  }
}
