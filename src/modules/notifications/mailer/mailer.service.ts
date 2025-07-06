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

//  async sendWelcomeEmailToEmployee(employee: Employee) {
//     const email = employee?.user?.email;
//     if (!email) {
//       this.logger.warn('No se puede enviar bienvenida al empleado: Email vacío');
//       return;
//     }

//     await this.sendMail(
//       email,
//       '¡Bienvenido a Nivo!',
//       'welcome-employee',
//       {
//         name: `${employee.user.first_name} ${employee.user.last_name}`,
//       },
//     );
//   }

//   async sendWelcomeEmailToClient(client: Client) {
//     const email = client?.user?.email;
//     if (!email) {
//       this.logger.warn('No se puede enviar bienvenida al cliente: Email vacío');
//       return;
//     }

//     await this.sendMail(
//       email,
//       '¡Bienvenido a nuestra tienda!',
//       'welcome-client',
//       {
//         name: `${client.user.first_name} ${client.user.last_name}`,
//       },
//     );
//   }

//  async sendLoginNotificationToEmployee(employee: Employee) {
//   const email = employee?.user?.email;
//   const name = employee?.user?.first_name || 'Usuario';

//   if (!email) {
//     this.logger.error('[MAILER SERVICE ERROR] No recipient defined');
//     return;
//   }

//   const loginTime = new Date().toLocaleString('es-CO', {
//     dateStyle: 'short',
//     timeStyle: 'short',
//   });

//   await this.sendMail(
//     email,
//     'Inicio de sesión detectado',
//     'login-employee',
//     {
//       name,
//       loginTime,
//     },
//   );
// }

//   async sendLoginNotificationToClient(client: Client) {
//     const email = client?.user?.email;
//     if (!email) {
//       this.logger.warn('No se puede enviar notificación de login al cliente: Email vacío');
//       return;
//     }

//     const name = `${client.user.first_name} ${client.user.last_name}`;
//     const now = new Date().toLocaleString('es-CO', {
//       dateStyle: 'short',
//       timeStyle: 'short',
//     });

//     await this.sendMail(
//       email,
//       'Inicio de sesión en tu cuenta',
//       'login-client',
//       {
//         name,
//         loginTime: now,
//       },
//     );
//   }
}
