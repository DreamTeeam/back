import { Controller, Get } from '@nestjs/common';
import { NotificationsCronService } from './notifications-cron.service';
import { MailerService } from './mailer/mailer.service'; 

@Controller('notifications')
export class NotificationsTestController {
  constructor(private readonly notificationsCronService: NotificationsCronService,
 private readonly mailerService: MailerService,
 private readonly cronService: NotificationsCronService,

  ) {}

  @Get('test-low-stock')
  testLowStock() {
    return this.notificationsCronService.notifyLowStock();
  }

  @Get('test-mail')
async testMail() {
  return this.mailerService.sendMail(
    'steve.cardm@gmail.com',
    'Correo de prueba',
    'stock-low-single', // asegúrate de que este template exista
    {
      productName: 'Zapatos Nube',
      stockLeft: 2,
      productUrl: 'https://nivo.com/products/zapatos-nube',
      productImage: 'https://nivo.com/zapatos-nube.jpg',
    },
  );
}

  @Get('membership')
  async testMembership() {
    await this.notificationsCronService.notifyMembershipExpiring();
    return { ok: true, message: 'Membresías notificadas' };
  }

  @Get('company')
  async testCompany() {
    await this.cronService.notifyCompanySubscriptionsExpiring();
    return { ok: true, message: 'Suscripciones de empresa notificadas' };
  }

  @Get('stock')
  async testLowStockc() {
    await this.cronService.notifyLowStock();
    return { ok: true, message: 'Stock bajo notificado' };
  }

  @Get('summary')
  async testSalesSummary() {
    await this.cronService.sendWeeklySalesSummary();
    return { ok: true, message: 'Resumen de ventas enviado' };
  }
}
