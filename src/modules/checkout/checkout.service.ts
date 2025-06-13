import { Injectable } from '@nestjs/common';
import { transporter } from './mailer.config';
import { Order } from 'src/modules/orders/entities/order.entity';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
const PdfPrinter = require('pdfmake');

@Injectable()
export class CheckoutService {
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
}









