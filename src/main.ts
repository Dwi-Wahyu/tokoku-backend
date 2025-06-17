import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Abaikan properti yang tidak ada di DTO
      transform: true, // Secara otomatis mengubah payload ke tipe DTO
      transformOptions: {
        enableImplicitConversion: true, // Izinkan konversi tipe implisit (untuk @Type)
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Tokoku API')
    .setDescription('Dokumentasi REST API untuk aplikasi Tokoku')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
