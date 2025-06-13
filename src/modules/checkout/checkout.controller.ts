import { Controller, Post, Body } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { Order } from 'src/modules/orders/entities/order.entity';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('send-confirmation')
  sendEmail(@Body() order: Order) {
    return this.checkoutService.sendConfirmationEmail(order);
 }

 @Post('send-test')
  sendTestEmail() {
    const mockOrder: any = {
      folio: 'F123456',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      totalOrder: 2499.99,
      client: { email: 'tu-correo@gmail.com' }, // tu correo real o uno de prueba
      details: [
        {
          product: { name: 'Zapatillas Nike Air Max' },
          totalAmountOfProducts: 1,
          subtotalOrder: 1499.99,
        },
        {
          product: { name: 'Buzo Adidas Essentials' },
          totalAmountOfProducts: 1,
          subtotalOrder: 1000.00,
        },
      ],
    };

    return this.checkoutService.sendConfirmationEmail(mockOrder);
  }
}
