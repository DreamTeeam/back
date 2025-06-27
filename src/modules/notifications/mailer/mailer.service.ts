import { Injectable } from '@nestjs/common';
import { MailerService as BaseMailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailerService {
  constructor(private readonly mailerService: BaseMailerService) {}

  async sendMail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, any>
  ) {
    await this.mailerService.sendMail({
      to,
      subject,
      template,
      context,
    });
  }
}
