import { Injectable, NotFoundException } from '@nestjs/common';
import { Order } from '../../modules/orders/entities/order.entity';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { Repository } from 'typeorm';
import { transporter } from './mailer.config';
import { InjectTenantRepository } from '../../common/typeorm-tenant-repository/tenant-repository.decorator';

const PdfPrinter = require('pdfmake');
@Injectable()
export class CheckoutService {
  constructor(
    @InjectTenantRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async sendConfirmationEmail(orderId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: [
        'details',
        'details.variant',
        'details.variant.product',
        'client',
        'client.user',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Orden con ID ${orderId} no encontrada`);
    }

    const pdfBuffer = await this.generateTicketPdf(orderId);

    await transporter.sendMail({
      from: '"Nivo" <no-reply@nivo.com>',
      to: order.client?.user?.email || 'fallback@mail.com',
      subject: 'Confirmación de Compra - Nivo',
      text: `¡Gracias por tu compra!\nFolio: ${order.folio}\nTotal: $${order.total_order}`,
      attachments: [
        {
          filename: 'ticket.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    return { message: 'Correo enviado correctamente' };
  }

  async generateTicketPdf(orderId: string): Promise<Buffer> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: [
        'details',
        'details.variant',
        'details.variant.product',
        'client',
        'client.user',
      ],
    });

    if (!order) throw new Error('Orden no encontrada');

    const fonts = {
      Roboto: {
        normal: 'src/fonts/Roboto-Regular.ttf',
        bold: 'src/fonts/Roboto-Bold.ttf',
        italics: 'src/fonts/Roboto-Regular.ttf',
        bolditalics: 'src/fonts/Roboto-Bold.ttf',
      },
    };

    const printer = new PdfPrinter(fonts);

    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: 'Ticket de compra', style: 'header' },
        { text: `Folio: ${order.folio}` },
        { text: `Fecha: ${order.date}` },
        { text: `Hora: ${order.time}` },
        { text: `Total: $${order.total_order}`, margin: [0, 10] },
        { text: 'Productos:', margin: [0, 10] },
        {
          ul: order.details.map(
            (item) =>
              `${item.variant.product.name} x${item.total_amount_of_products} = $${item.subtotal_order}`,
          ),
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
      },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.end();
    });
  }
}
