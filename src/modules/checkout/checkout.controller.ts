import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { Order } from 'src/modules/orders/entities/order.entity';
import { Response } from 'express';
import { Res } from '@nestjs/common';

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

  @Get('ticket/:id')
async showTicket(@Param('id') id: string, @Res() res: Response) {
  const buffer = await this.checkoutService.generateTicketPdf(id);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'inline; filename=ticket.pdf',
  });

  res.end(buffer);
}

//LUEGO BORRAR
@Get('create-fake-order')
async createAndReturnId() {
  return await this.checkoutService.createFakeOrder();
}

}
