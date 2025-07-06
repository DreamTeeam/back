import { Controller, Post, Get, Param, Res } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';

@ApiTags('Checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @ApiOperation({ summary: 'Enviar ticket de compra por email (PDF)' })
  @ApiParam({ name: 'id', description: 'ID de la orden' })
  @Post('send-confirmation/:id')
  async sendEmail(@Param('id') id: string) {
    return this.checkoutService.sendConfirmationEmail(id);
  }

  @ApiOperation({ summary: 'Enviar ticket de prueba (mock)' })
@Post('send-test')
sendTestEmail() {
  const mockOrder: any = {
    folio: 'F123456',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0],
    totalOrder: 2499.99,
    client: { user: { email: 'dreamteeam20@gmail.com' } },
    details: [
      {
        variant: {
          product: { name: 'Zapatillas Nike Air Max' },
        },
        total_amount_of_products: 1,
        subtotal_order: 1499.99,
      },
      {
        variant: {
          product: { name: 'Buzo Adidas Essentials' },
        },
        total_amount_of_products: 1,
        subtotal_order: 1000.0,
      },
    ],
  };

  return this.checkoutService.sendMockEmail(mockOrder);
}


  @ApiOperation({ summary: 'Visualizar ticket de compra en PDF' })
  @ApiParam({ name: 'id', description: 'ID de la orden' })
  @Get('ticket/:id')
  async showTicket(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.checkoutService.generateTicketPdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename=ticket.pdf',
    });

    res.end(buffer);
  }
}
