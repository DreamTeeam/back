import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loggerGlobal } from './middlewares/logger.middleware';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.enableCors({
    origin: 'https://nivoapp.vercel.app',   //BUG Para Producción
    // origin: 'http://localhost:4000',     //BUG Para Local
    credentials: true,
  });

  app.use(loggerGlobal);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NIVO POS API')
    .setVersion('1.0.0')
    .setDescription(
      'Esta es la documentación del proyecto final **API Nivo**, una aplicación web de punto de venta (POS) diseñada para gestionar productos, categorías, marcas, subcategorías, usuarios, auditorías y operaciones de venta. La API permite realizar operaciones CRUD seguras, validar relaciones entre entidades y mantener registros detallados para control administrativo.',
    )
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  app.use(cookieParser());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
