import { Injectable } from '@nestjs/common';
import { transporter } from './mailer.config';
import { Order } from 'src/modules/orders/entities/order.entity';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeepPartial } from 'typeorm';



const PdfPrinter = require('pdfmake');

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async sendConfirmationEmail(order: Order) {
    const emailBody = `
      ¡Gracias por tu compra!

      Folio: ${order.folio}
      Fecha: ${order.date}
      Hora: ${order.time}
      Total: $${order.totalOrder}

      Productos:
      ${order.details.map((item) => 
        `- ${item.product.name} x${item.totalAmountOfProducts} = $${item.subtotalOrder}`
      ).join('\n')}
    `;

    const fonts = {
      Roboto: {
        normal: 'src/fonts/Roboto-Regular.ttf',
        bold: 'src/fonts/Roboto-Bold.ttf',
        italics: 'src/fonts/Roboto-Regular.ttf',
        bolditalics: 'src/fonts/Roboto-Bold.ttf',
      }
    };

    const printer = new PdfPrinter(fonts);

    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: 'Ticket de compra', style: 'header' },
        { text: `Folio: ${order.folio}` },
        { text: `Fecha: ${order.date}` },
        { text: `Hora: ${order.time}` },
        { text: `Total: $${order.totalOrder}`, margin: [0, 10] },
        { text: 'Productos:', margin: [0, 10] },
        {
          ul: order.details.map((item) =>
            `${item.product.name} x${item.totalAmountOfProducts} = $${item.subtotalOrder}`
          )
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10]
        }
      }
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', async () => {
        const pdfBuffer = Buffer.concat(chunks);

        await transporter.sendMail({
          from: '"Tu Tienda" <no-reply@tutienda.com>',
          to: order.client?.email || 'cliente@example.com',
          subject: 'Confirmación de compra',
          text: emailBody,
          attachments: [
            {
              filename: `ticket_${order.folio}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf',
            }
          ]
        });

        resolve({ message: 'Correo enviado con ticket PDF' });
      });
      pdfDoc.end();
    });
  }

  async generateTicketPdf(orderId: string): Promise<Buffer> {
  const order = await this.orderRepo.findOne({
    where: { id: orderId },
    relations: ['details', 'details.product', 'client'],
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
        { text: `Total: $${order.totalOrder}`, margin: [0, 10] },
        { text: 'Productos:', margin: [0, 10] },
        {
          ul: order.details.map((item) =>
            `${item.product.name} x${item.totalAmountOfProducts} = $${item.subtotalOrder}`
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
  //LUEGO BORRAR
  
  async createFakeOrder(): Promise<string> {
  const orderData = {
    folio: 'F888888',
    totalProducts: 2,
    totalOrder: 2499.99,
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 8),

    client: { id: 1 },
    employee: { id: 1 },
    typeOfPayment: { id: 1 },

    details: [
      {
        product: { id: 1 },
        price: 1499.99,
        totalAmountOfProducts: 1,
        subtotalOrder: 1499.99,
      },
      {
        product: { id: 2 },
        price: 1000,
        totalAmountOfProducts: 1,
        subtotalOrder: 1000,
      },
    ],
  } as DeepPartial<Order>;

  const order = this.orderRepo.create(orderData);
  const savedOrder = await this.orderRepo.save(order);
  return savedOrder.id;
}

  }
