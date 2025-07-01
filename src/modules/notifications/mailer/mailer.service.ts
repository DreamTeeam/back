import { Injectable, Logger } from '@nestjs/common';
import { MailerService as BaseMailerService } from '@nestjs-modules/mailer';
import { User } from 'src/modules/users/entities/user.entity';
import { Client } from 'src/modules/users/entities/client.entity';
import { Employee } from 'src/modules/users/entities/employee.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly mailerService: BaseMailerService) {}

  async sendMail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, any>,
  ) {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context,
      });
      this.logger.log('[MAILER SERVICE] Correo enviado exitosamente a:', to);
    } catch (err) {
      this.logger.error(`[ERROR] Fallo al enviar correo a ${to}`, err.stack);
    }
  }

  async sendLowStockNotification(
    userEmail: string,
    context: Record<string, any>,
  ) {
    if (!userEmail) {
      this.logger.warn('No se pudo enviar notificación de stock: Email vacío');
      return;
    }
    await this.sendMail(userEmail, 'Low stock alert!', 'low-stock', context);
  }
}