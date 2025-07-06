import { Injectable, Logger } from '@nestjs/common';
import { CustomerService } from 'src/master_data/customer/customer.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly customerService: CustomerService) {}

  async validateTenant(tenantSlug: string): Promise<boolean> {
    try {
      const customer = await this.customerService.findOneBySlug(tenantSlug);
      return !!customer;
    } catch (error) {
      this.logger.warn(
        `Intento de conexión con tenant inválido: ${tenantSlug}`,
      );
      return false;
    }
  }

}
